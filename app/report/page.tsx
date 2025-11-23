"use client"

import { Navigation } from "@/components/navigation"
import { ReportForm } from "@/components/report-form"
import { ReportsList } from "@/components/reports-list"
import { getAllCitizenReports, getLatestSensorData } from "@/lib/firebase-service"
import { useEffect, useState } from "react"
import type { CitizenReport, SensorReading } from "@/lib/types"

export default function ReportPage() {
  const [reports, setReports] = useState<CitizenReport[]>([])
  const [sensorData, setSensorData] = useState<SensorReading | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [fetchedReports, fetchedSensorData] = await Promise.all([getAllCitizenReports(), getLatestSensorData()])
      setReports(fetchedReports)
      console.log("[v0] ENV Index updated from sensor data:", fetchedSensorData?.environment?.env_index)
      setSensorData(fetchedSensorData)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Fetch data immediately on mount
    fetchData()

    // Set up interval to fetch data every 5 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 5000)

    // Clean up interval on unmount
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation role="citizen" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-[60vh]">
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="citizen" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Report Air Quality Issues</h1>
          <p className="text-muted-foreground text-lg">Help us monitor air quality by reporting issues in your area</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <ReportForm />
          </div>

          <div>
            <ReportsList reports={reports} sensorData={sensorData} showActions={false} />
          </div>
        </div>
      </main>
    </div>
  )
}
