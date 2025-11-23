import { NextResponse } from "next/server"

const FIREBASE_DB_URL = "https://aerovant-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app"

export const dynamic = "force-dynamic"

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

export async function GET() {
  try {
    console.log("[v0] API route: Fetching latest sensor data from Firebase REST API...")

    const url = `${FIREBASE_DB_URL}/aerovant_readings.json?orderBy="$key"&limitToLast=1`
    const response = await fetchWithRetry(url)

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
    return NextResponse.json(
      { error: "Failed to fetch sensor data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
