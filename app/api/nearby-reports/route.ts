import { type NextRequest, NextResponse } from "next/server"
import { getAllCitizenReports, getNearbyReports } from "@/lib/firebase-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    const radius = searchParams.get("radius")

    if (!lat || !lon) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
    }

    const latitude = Number.parseFloat(lat)
    const longitude = Number.parseFloat(lon)
    const radiusKm = radius ? Number.parseFloat(radius) : 10

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const allReports = await getAllCitizenReports()
    const nearbyReports = getNearbyReports(allReports, latitude, longitude, radiusKm)

    return NextResponse.json(nearbyReports)
  } catch (error) {
    console.error("Error fetching nearby reports:", error)
    return NextResponse.json({ error: "Failed to fetch nearby reports" }, { status: 500 })
  }
}
