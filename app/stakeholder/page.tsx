"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AirQualityCard } from "@/components/air-quality-card"
import { StatsOverview } from "@/components/stats-overview"
import { RecentActivity } from "@/components/recent-activity"
import { LiveCharts } from "@/components/live-charts"
import { AlertTriangle, CheckCircle, Clock, FileText, BarChart3, FileWarning } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import type { SensorReading, CitizenReport } from "@/lib/types"

export default function StakeholderDashboard() {
  const [sensorData, setSensorData] = useState<SensorReading | null>(null)
  const [reports, setReports] = useState<CitizenReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch initial data
    fetchData()

    const interval = setInterval(() => {
      fetchData()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [sensorRes, reportsRes] = await Promise.all([
        fetch(`/api/sensor-data?t=${Date.now()}`),
        fetch(`/api/reports?t=${Date.now()}`),
      ])

      const sensor = sensorRes.ok ? await sensorRes.json() : null
      const fetchedReports = reportsRes.ok ? await reportsRes.json() : []

      setSensorData(sensor)
      setReports(Array.isArray(fetchedReports) ? fetchedReports : [])
      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching stakeholder data:", error)
      setIsLoading(false)
    }
  }

  const pendingReports = reports.filter((r) => r.status === "pending").length
  const investigatingReports = reports.filter((r) => r.status === "investigating").length
  const resolvedReports = reports.filter((r) => r.status === "resolved").length
  const totalReports = reports.length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation role="stakeholder" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-[60vh]">
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="stakeholder" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Stakeholder Dashboard</h1>
          <p className="text-muted-foreground text-lg">Comprehensive air quality monitoring and report management</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold text-foreground">{totalReports}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-3xl font-bold text-foreground">{pendingReports}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Investigating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-3xl font-bold text-foreground">{investigatingReports}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-3xl font-bold text-foreground">{resolvedReports}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Button asChild size="lg" className="h-auto py-6">
            <Link href="/stakeholder/reports" className="flex items-center gap-3">
              <FileWarning className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold text-lg">Manage Reports</div>
                <div className="text-sm opacity-90">Review and update citizen reports</div>
              </div>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 bg-transparent">
            <Link href="/stakeholder/analytics" className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold text-lg">View Analytics</div>
                <div className="text-sm opacity-90">Historical data and trends</div>
              </div>
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2" key={sensorData?.timestamp}>
            <AirQualityCard data={sensorData} />
          </div>

          <div>
            <StatsOverview sensorData={sensorData} />
          </div>
        </div>

        <LiveCharts />

        <div className="mt-6">
          <RecentActivity reports={reports.slice(0, 5)} />
        </div>
      </main>
    </div>
  )
}
