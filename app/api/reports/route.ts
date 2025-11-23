import { NextResponse } from "next/server"
import { deleteReport } from "@/lib/firebase-service"

const FIREBASE_DB_URL = "https://aerovant-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[v0] API route: Fetching citizen reports from Firebase REST API...")

    // Query Firebase Realtime Database REST API directly
    const url = `${FIREBASE_DB_URL}/citizen_reports.json`
    console.log("[v0] API route: Fetching from URL:", url)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.error(`[v0] API route: Firebase returned status ${response.status}`)
      throw new Error(`Firebase request failed with status ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] API route: Firebase REST response received")

    if (!data || typeof data !== "object") {
      return NextResponse.json([])
    }

    // Transform Firebase object to array format
    const reports = Object.entries(data).map(([id, report]) => ({
      id,
      ...(report as any),
      notes: (report as any).description, // Map description to notes
      location: (report as any).location_area, // Map location_area to location
    }))

    return NextResponse.json(reports)
  } catch (error) {
    console.error("[v0] API route error:", error instanceof Error ? error.message : String(error))
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      location,
      latitude,
      longitude,
      notes,
      report_type,
      reporter_name,
      reporter_contact,
      reporter_phone,
      photos,
    } = body

    if (!notes || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields: notes, latitude, longitude" }, { status: 400 })
    }

    const newReport = {
      description: notes, // Map notes to description for Firebase
      location_area: location,
      latitude,
      longitude,
      report_type,
      reporter_name: reporter_name || null,
      reporter_contact: reporter_contact || null,
      reporter_phone: reporter_phone || null,
      severity: "pending", // Default severity
      photos: photos || [],
      timestamp: new Date().toISOString(),
      status: "pending",
      deployed: false,
      messages: [],
    }

    // Write to Firebase REST API
    const url = `${FIREBASE_DB_URL}/citizen_reports.json`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newReport),
    })

    if (!response.ok) {
      throw new Error(`Firebase request failed with status ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      id: result.name,
      ...newReport,
    })
  } catch (error) {
    console.error("[v0] Error creating citizen report:", error)
    return NextResponse.json(
      { error: "Failed to create report", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("id")

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const success = await deleteReport(reportId)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error deleting report:", error)
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { reportId, status, deployed, deployment_date, deployment_notes, addMessage } = body

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    if (status !== undefined) {
      console.log("[v0] Updating report status:", reportId, status)
      const url = `${FIREBASE_DB_URL}/citizen_reports/${reportId}.json`
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Status update failed:", error)
        return NextResponse.json({ error: "Failed to update report status" }, { status: 500 })
      }
      console.log("[v0] Status updated successfully")
    }

    if (deployed !== undefined) {
      console.log("[v0] Updating deployment status:", reportId, deployed)
      const url = `${FIREBASE_DB_URL}/citizen_reports/${reportId}.json`
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deployed,
          deployment_date: deployed ? deployment_date || new Date().toISOString() : null,
          deployment_notes: deployed ? deployment_notes : null,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("[v0] Deployment update failed:", error)
        return NextResponse.json({ error: "Failed to update deployment status" }, { status: 500 })
      }
      console.log("[v0] Deployment updated successfully")
    }

    if (addMessage) {
      console.log("[v0] Adding message to report:", reportId)
      const url = `${FIREBASE_DB_URL}/citizen_reports/${reportId}.json`

      // Fetch current report to get existing messages
      const getResponse = await fetch(url)
      if (!getResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
      }

      const currentReport = await getResponse.json()
      const messages = currentReport.messages || []

      // Add new message with ID
      const newMessage = {
        id: Date.now().toString(),
        ...addMessage,
      }
      messages.push(newMessage)

      // Update report with new message
      const updateResponse = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      })

      if (!updateResponse.ok) {
        const error = await updateResponse.text()
        console.error("[v0] Add message failed:", error)
        return NextResponse.json({ error: "Failed to add message" }, { status: 500 })
      }

      console.log("[v0] Message added successfully")

      // Return updated report
      const updatedReport = await updateResponse.json()
      return NextResponse.json({
        ...currentReport,
        messages,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating report:", error)
    return NextResponse.json(
      { error: "Failed to update report", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
