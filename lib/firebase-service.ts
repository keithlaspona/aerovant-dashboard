import type { SensorReading, CitizenReport, ReportMessage } from "./types"

// Sensor location (USTP, Cagayan de Oro, Philippines)
export const SENSOR_LOCATION = {
  latitude: 8.486071,
  longitude: 124.656805,
  name: "USTP Campus",
}

// Helper function to make local API route calls
async function firebaseRequest(path: string, options?: RequestInit) {
  try {
    let apiRoute = ""
    if (path.includes("aerovant_readings")) {
      apiRoute = "/api/sensor-data"
    } else if (path.includes("citizen_reports")) {
      apiRoute = "/api/reports"
    } else {
      throw new Error(`Unknown path: ${path}`)
    }

    console.log("[v0] Making API request to:", apiRoute, "with method:", options?.method || "GET")

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    const fullUrl = apiRoute.startsWith("http") ? apiRoute : `${baseUrl}${apiRoute}`

    const response = await fetch(fullUrl, {
      ...options,
      cache: options?.cache || "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] API error response:", errorText)
      throw new Error(`API request failed with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] API response data received")
    return data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log("[v0] firebaseRequest error details:", errorMessage)
    throw new Error(`API request failed: ${errorMessage}`)
  }
}

export async function getLatestSensorData(): Promise<SensorReading | null> {
  try {
    console.log("[v0] getLatestSensorData: Fetching latest sensor data...")

    const response = await fetch("/api/sensor-data", {
      cache: "no-store",
    })

    if (!response.ok) {
      console.log("[v0] getLatestSensorData: API call failed with status", response.status)
      throw new Error(`Failed to fetch sensor data: ${response.status}`)
    }

    const latestReading = await response.json()
    console.log("[v0] getLatestSensorData: Response received:", JSON.stringify(latestReading))
    console.log("[v0] getLatestSensorData: ml_prediction:", latestReading?.ml_prediction)

    if (latestReading && typeof latestReading === "object") {
      console.log("[v0] getLatestSensorData: Returning Firebase data with ml_prediction")
      return {
        ...latestReading,
        location: SENSOR_LOCATION,
      }
    }

    throw new Error("Invalid sensor data response format")
  } catch (error) {
    console.error("[v0] getLatestSensorData error:", error)
    throw error
  }
}

export async function getSensorDataInRange(startTime: Date, endTime: Date): Promise<SensorReading[]> {
  try {
    console.log("[v0] Fetching sensor data range from Firebase...")
    const data = await firebaseRequest("/aerovant_readings")

    if (!data || typeof data !== "object") {
      console.log("[v0] No data returned from Firebase")
      throw new Error("No sensor data returned from Firebase")
    }

    const filtered: SensorReading[] = []

    Object.entries(data).forEach(([_key, reading]) => {
      const readingData = reading as SensorReading
      const readingTime = new Date(readingData.timestamp)

      if (readingTime >= startTime && readingTime <= endTime) {
        filtered.push({
          ...readingData,
          location: SENSOR_LOCATION,
        })
      }
    })

    return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  } catch (error) {
    console.error("[v0] Error fetching sensor data range from Firebase:", error)
    throw error
  }
}

export async function getAllCitizenReports(): Promise<CitizenReport[]> {
  try {
    console.log("[v0] Fetching citizen reports from Firebase...")
    const response = await fetch("/api/reports", {
      cache: "no-store",
    })

    if (!response.ok) {
      console.log("[v0] API call failed with status", response.status)
      throw new Error(`Failed to fetch citizen reports: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Citizen reports fetched successfully")

    if (!Array.isArray(data)) {
      throw new Error("Invalid citizen reports response format")
    }

    return data
  } catch (error) {
    console.error("[v0] Error fetching citizen reports from Firebase:", error)
    throw error
  }
}

export async function submitCitizenReport(
  report: Omit<CitizenReport, "id" | "timestamp" | "status">,
): Promise<boolean> {
  try {
    console.log("[v0] Submitting citizen report:", report)

    const newReport = {
      ...report,
      timestamp: new Date().toISOString(),
      status: "pending",
    }

    const result = await firebaseRequest("/citizen_reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newReport),
    })

    console.log("[v0] Report submitted successfully:", result)
    return true
  } catch (error) {
    console.error("[v0] Error submitting citizen report:", error)
    return false
  }
}

export async function updateReportStatus(reportId: string, status: CitizenReport["status"]): Promise<boolean> {
  try {
    await firebaseRequest("/citizen_reports", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportId, status }),
    })
    return true
  } catch (error) {
    console.error("[v0] Error updating report status:", error)
    return false
  }
}

export async function updateReportDeployment(
  reportId: string,
  deployed: boolean,
  deployment_date?: string | null,
  deployment_notes?: string | null,
): Promise<boolean> {
  try {
    await firebaseRequest("/citizen_reports", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportId,
        deployed,
        deployment_date: deployment_date || null,
        deployment_notes: deployment_notes || null,
      }),
    })
    return true
  } catch (error) {
    console.error("[v0] Error updating deployment:", error)
    return false
  }
}

export async function addMessageToReport(
  reportId: string,
  message: Omit<ReportMessage, "id">,
): Promise<CitizenReport | null> {
  try {
    const result = await firebaseRequest("/citizen_reports", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportId,
        addMessage: message,
      }),
    })

    return result as CitizenReport
  } catch (error) {
    console.error("[v0] Error adding message to report:", error)
    return null
  }
}

export async function deleteReport(reportId: string): Promise<boolean> {
  try {
    // which doesn't support dynamic paths with report IDs
    const FIREBASE_DB_URL = "https://aerovant-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app"
    const url = `${FIREBASE_DB_URL}/citizen_reports/${reportId}.json`

    console.log("[v0] Deleting report from Firebase:", reportId)

    const response = await fetch(url, {
      method: "DELETE",
    })

    if (!response.ok) {
      const error = await response.text()
      console.log("[v0] Delete failed response:", error)
      throw new Error(`Firebase delete failed with status ${response.status}: ${error}`)
    }

    console.log("[v0] Report deleted successfully:", reportId)
    return true
  } catch (error) {
    console.error("[v0] Error deleting report:", error)
    return false
  }
}

// Haversine formula to calculate distance between two points
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function getNearbyReports(
  reports: CitizenReport[],
  latitude: number,
  longitude: number,
  radiusKm = 5,
): CitizenReport[] {
  return reports
    .map((report) => {
      if (!report.latitude || !report.longitude) return null

      const distance = calculateDistance(latitude, longitude, report.latitude, report.longitude)

      if (distance <= radiusKm) {
        return {
          ...report,
          distance_km: Math.round(distance * 100) / 100,
        }
      }
      return null
    })
    .filter((report): report is CitizenReport => report !== null)
}
