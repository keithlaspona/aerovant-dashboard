import { NextResponse } from "next/server"
import { generateSimulatedReading } from "@/lib/simulation-service"

const FIREBASE_DB_URL = "https://aerovant-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app"

export const dynamic = "force-dynamic"

// Server-side simulation state (persisted across requests)
let serverSimulationEnabled = false
let lastSimulatedData: ReturnType<typeof generateSimulatedReading> | null = null
let lastSimulationUpdate = 0

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

    if (action === "toggle") {
      serverSimulationEnabled = !serverSimulationEnabled
      if (serverSimulationEnabled) {
        lastSimulatedData = generateSimulatedReading()
        lastSimulationUpdate = Date.now()
      } else {
        lastSimulatedData = null
      }
      console.log(`[v0] Simulation mode ${serverSimulationEnabled ? "ENABLED" : "DISABLED"}`)
      return NextResponse.json({ 
        simulation: serverSimulationEnabled,
        data: serverSimulationEnabled ? lastSimulatedData : null
      })
    }

    if (action === "set") {
      serverSimulationEnabled = enabled === true
      if (serverSimulationEnabled) {
        lastSimulatedData = generateSimulatedReading()
        lastSimulationUpdate = Date.now()
      } else {
        lastSimulatedData = null
      }
      console.log(`[v0] Simulation mode SET to ${serverSimulationEnabled}`)
      return NextResponse.json({ 
        simulation: serverSimulationEnabled,
        data: serverSimulationEnabled ? lastSimulatedData : null
      })
    }

    if (action === "status") {
      return NextResponse.json({ 
        simulation: serverSimulationEnabled,
        data: serverSimulationEnabled ? lastSimulatedData : null
      })
    }

    if (action === "spike") {
      if (serverSimulationEnabled) {
        // Generate a spike event
        const { triggerSpikeEvent } = await import("@/lib/simulation-service")
        lastSimulatedData = triggerSpikeEvent()
        lastSimulationUpdate = Date.now()
        return NextResponse.json({ 
          simulation: true,
          data: lastSimulatedData,
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

  // If simulation is enabled and not forcing real data
  if (serverSimulationEnabled && !forceReal) {
    const now = Date.now()
    // Generate new data every 4 seconds
    if (!lastSimulatedData || now - lastSimulationUpdate >= 4000) {
      lastSimulatedData = generateSimulatedReading()
      lastSimulationUpdate = now
      console.log("[v0] Generated new simulated data")
    }
    
    return NextResponse.json({
      ...lastSimulatedData,
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
    if (!serverSimulationEnabled) {
      serverSimulationEnabled = true
      lastSimulatedData = generateSimulatedReading()
      lastSimulationUpdate = Date.now()
    } else if (!lastSimulatedData || Date.now() - lastSimulationUpdate >= 4000) {
      lastSimulatedData = generateSimulatedReading()
      lastSimulationUpdate = Date.now()
    }
    
    return NextResponse.json({
      ...lastSimulatedData,
      _simulation: true,
      _fallback: true
    })
  }
}
