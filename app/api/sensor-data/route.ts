import { NextResponse } from "next/server"
import { generateSimulatedReading } from "@/lib/simulation-service"

const FIREBASE_DB_URL = "https://aerovant-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app"

export const dynamic = "force-dynamic"

// Use globalThis to persist state across hot reloads in development
// This ensures the simulation state survives module reloads
interface SimulationState {
  enabled: boolean
  lastData: ReturnType<typeof generateSimulatedReading> | null
  lastUpdate: number
}

declare global {
  // eslint-disable-next-line no-var
  var __aerovant_simulation__: SimulationState | undefined
}

// Initialize or get existing simulation state
function getSimulationState(): SimulationState {
  if (!globalThis.__aerovant_simulation__) {
    globalThis.__aerovant_simulation__ = {
      enabled: false,
      lastData: null,
      lastUpdate: 0
    }
  }
  return globalThis.__aerovant_simulation__
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url)

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json") && !response.ok) {
        // Firebase returned an error page (HTML), not JSON
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000
          console.log(`[v0] Rate limited, retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      return response
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }

  throw new Error("Max retries exceeded")
}

// POST endpoint to toggle simulation mode
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, enabled } = body
    const state = getSimulationState()

    if (action === "toggle") {
      state.enabled = !state.enabled
      if (state.enabled) {
        state.lastData = generateSimulatedReading()
        state.lastUpdate = Date.now()
      } else {
        state.lastData = null
      }
      console.log(`[v0] Simulation mode ${state.enabled ? "ENABLED" : "DISABLED"} (globalThis persisted)`)
      return NextResponse.json({ 
        simulation: state.enabled,
        data: state.enabled ? state.lastData : null
      })
    }

    if (action === "set") {
      state.enabled = enabled === true
      if (state.enabled) {
        state.lastData = generateSimulatedReading()
        state.lastUpdate = Date.now()
      } else {
        state.lastData = null
      }
      console.log(`[v0] Simulation mode SET to ${state.enabled} (globalThis persisted)`)
      return NextResponse.json({ 
        simulation: state.enabled,
        data: state.enabled ? state.lastData : null
      })
    }

    if (action === "status") {
      console.log(`[v0] Simulation status check: ${state.enabled}`)
      return NextResponse.json({ 
        simulation: state.enabled,
        data: state.enabled ? state.lastData : null
      })
    }

    if (action === "spike") {
      if (state.enabled) {
        // Generate a spike event
        const { triggerSpikeEvent } = await import("@/lib/simulation-service")
        state.lastData = triggerSpikeEvent()
        state.lastUpdate = Date.now()
        return NextResponse.json({ 
          simulation: true,
          data: state.lastData,
          spike: true
        })
      }
      return NextResponse.json({ error: "Simulation not enabled" }, { status: 400 })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] POST error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const forceReal = requestUrl.searchParams.get("real") === "true"
  const state = getSimulationState()

  console.log(`[v0] GET request - simulation enabled: ${state.enabled}, forceReal: ${forceReal}`)

  // If simulation is enabled and not forcing real data
  if (state.enabled && !forceReal) {
    const now = Date.now()
    // Generate new data every 4 seconds
    if (!state.lastData || now - state.lastUpdate >= 4000) {
      state.lastData = generateSimulatedReading()
      state.lastUpdate = now
      console.log("[v0] Generated new simulated data")
    }
    
    return NextResponse.json({
      ...state.lastData,
      _simulation: true
    })
  }
  try {
    console.log("[v0] API route: Fetching latest sensor data from Firebase REST API...")

    const firebaseUrl = `${FIREBASE_DB_URL}/aerovant_readings.json?orderBy="$key"&limitToLast=1`
    const response = await fetchWithRetry(firebaseUrl)

    if (!response.ok) {
      throw new Error(`Firebase request failed with status ${response.status}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      throw new Error("Firebase returned non-JSON response (likely rate limited)")
    }

    const data = await response.json()
    console.log("[v0] API route: Firebase REST response received")

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "No sensor data available" }, { status: 404 })
    }

    const latestReading = Object.values(data)[0] as any
    console.log("[v0] API route: Latest reading extracted:", JSON.stringify(latestReading))

    if (latestReading.mL_prediction && !latestReading.ml_prediction) {
      latestReading.ml_prediction = latestReading.mL_prediction
      delete latestReading.mL_prediction
    }

    console.log("[v0] API route: ml_prediction in response:", latestReading?.ml_prediction)

    return NextResponse.json(latestReading)
  } catch (error) {
    console.error("[v0] API route error:", error)
    
    // Automatic fallback to simulation when Firebase is unavailable
    console.log("[v0] Firebase unavailable, auto-enabling simulation mode as fallback")
    const fallbackState = getSimulationState()
    if (!fallbackState.enabled) {
      fallbackState.enabled = true
      fallbackState.lastData = generateSimulatedReading()
      fallbackState.lastUpdate = Date.now()
    } else if (!fallbackState.lastData || Date.now() - fallbackState.lastUpdate >= 4000) {
      fallbackState.lastData = generateSimulatedReading()
      fallbackState.lastUpdate = Date.now()
    }
    
    return NextResponse.json({
      ...fallbackState.lastData,
      _simulation: true,
      _fallback: true
    })
  }
}
