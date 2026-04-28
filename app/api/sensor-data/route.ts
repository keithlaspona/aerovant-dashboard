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

// Initialize or get existing simulation state — always enabled by default
function getSimulationState(): SimulationState {
  if (!globalThis.__aerovant_simulation__) {
    globalThis.__aerovant_simulation__ = {
      enabled: true,
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

      return NextResponse.json({ 
        simulation: state.enabled,
        data: state.enabled ? state.lastData : null
      })
    }

    if (action === "status") {

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

  // If simulation is enabled and not forcing real data
  if (state.enabled && !forceReal) {
    const now = Date.now()
    // Generate new data every 4 seconds
    if (!state.lastData || now - state.lastUpdate >= 4000) {
      state.lastData = generateSimulatedReading()
      state.lastUpdate = now
    }
    
    return NextResponse.json({
      ...state.lastData,
      _simulation: true
    })
  }
  try {


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


    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "No sensor data available" }, { status: 404 })
    }

    const latestReading = Object.values(data)[0] as any


    if (latestReading.mL_prediction && !latestReading.ml_prediction) {
      latestReading.ml_prediction = latestReading.mL_prediction
      delete latestReading.mL_prediction
    }



    return NextResponse.json(latestReading)
  } catch (error) {
    console.error("[v0] API route error:", error)
    
    // Automatic fallback to simulation when Firebase is unavailable
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
