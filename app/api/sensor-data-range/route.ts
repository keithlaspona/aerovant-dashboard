import { type NextRequest, NextResponse } from "next/server"
import { getSensorDataInRange } from "@/lib/firebase-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!start || !end) {
      return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 })
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    const data = await getSensorDataInRange(startDate, endDate)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching sensor data range:", error)
    return NextResponse.json({ error: "Failed to fetch sensor data" }, { status: 500 })
  }
}
