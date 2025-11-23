"use client"

import { Navigation } from "@/components/navigation"
import { DroneControlPanel } from "@/components/drone-control-panel"
import { AirQualityStatusPanel } from "@/components/air-quality-status-panel"
import { AirSafetyIndexPanel } from "@/components/air-safety-index-panel"
import { InteractiveMap } from "@/components/interactive-map"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle, TrendingUp, Info, Send, Rocket } from "lucide-react"
import { getNearbyReports, SENSOR_LOCATION } from "@/lib/firebase-service"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import type { SensorReading, CitizenReport } from "@/lib/types"

export default function HomePage() {
  const [sensorData, setSensorData] = useState<SensorReading | null>(null)
  const [allReports, setAllReports] = useState<CitizenReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [sensorRes, reportsRes] = await Promise.all([
        fetch(`/api/sensor-data?t=${Date.now()}`),
        fetch(`/api/reports?t=${Date.now()}`),
      ])

      const sensor = sensorRes.ok ? await sensorRes.json() : null
      const reports = reportsRes.ok ? await reportsRes.json() : []

      console.log("[v0] Dashboard fetched sensor data:", sensor?.timestamp)
      setSensorData(sensor)
      setAllReports(Array.isArray(reports) ? reports : [])
      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching data from API:", error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 5000) // updated polling interval from 1 second to 5 seconds
    return () => clearInterval(interval)
  }, [])

  const nearbyReports = useMemo(() => {
    try {
      return getNearbyReports(allReports, SENSOR_LOCATION.latitude, SENSOR_LOCATION.longitude, 5)
    } catch (error) {
      console.error("[v0] Error calculating nearby reports:", error)
      return []
    }
  }, [allReports])

  const pendingReports = nearbyReports.filter((r) => r.status === "pending").length
  const deployedReports = nearbyReports.filter((r) => r.deployed).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation role="citizen" />
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
      <Navigation role="citizen" />

      <main className="container mx-auto px-4 py-4">
        <div className="mb-8">
          <h1 className="text-2xl mb-1 text-balance text-[rgba(52,63,86,1)] font-extrabold">Air Quality Monitoring</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            {SENSOR_LOCATION.name}, Cagayan de Oro
          </p>
        </div>

        <div className="grid lg:grid-cols-[45%_30%_25%] gap-6 mb-6">
          <div className="h-[528px]">
            <DroneControlPanel />
          </div>

          <div className="h-[528px]">
            <AirQualityStatusPanel data={sensorData} />
          </div>

          <div className="h-[528px]" key={sensorData?.timestamp}>
            <AirSafetyIndexPanel initialData={sensorData} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <InteractiveMap reports={nearbyReports} />

          <div className="space-y-6">
            <Card className="hover:shadow-lg transition-shadow border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Community Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-3xl font-bold text-foreground">{nearbyReports.length}</p>
                      <p className="text-sm text-muted-foreground">Reports within 5km</p>
                    </div>
                    {pendingReports > 0 && (
                      <div>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingReports}</p>
                        <p className="text-xs text-muted-foreground">Pending review</p>
                      </div>
                    )}
                  </div>

                  {deployedReports > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Rocket className="w-5 h-5" />
                        <div>
                          <p className="font-semibold">
                            {deployedReports} Sensor{deployedReports > 1 ? "s" : ""} Deployed
                          </p>
                          <p className="text-xs">Stakeholders have deployed sensors in response to reports</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button asChild className="w-full gap-2 bg-primary hover:bg-primary/90">
                    <Link href="/report">
                      <Send className="w-4 h-4" />
                      Submit a Report
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ENV Index</span>
                    <span className="font-semibold text-foreground">
                      {sensorData?.environment?.env_index?.toFixed(2) ?? "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">MQ135 Reading</span>
                    <span className="font-semibold text-foreground">
                      {sensorData ? `${sensorData.readings.MQ135_ppm.toFixed(1)} ppm` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Temperature</span>
                    <span className="font-semibold text-foreground">
                      {sensorData ? `${sensorData.environment.temperature.toFixed(1)}°C` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Humidity</span>
                    <span className="font-semibold text-foreground">
                      {sensorData ? `${sensorData.environment.humidity.toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">AI Assessment</span>
                    <Badge className="bg-primary text-primary-foreground">
                      {typeof sensorData?.ml_prediction?.classification === "number"
                        ? sensorData.ml_prediction.classification === 1
                          ? "Stable"
                          : "Critical"
                        : sensorData?.ml_prediction?.classification || "N/A"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="hover:shadow-lg transition-shadow border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              What is <span className="font-bold">ÆROVANT</span>?
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              <span className="font-bold">ÆROVANT</span> is a real-time air quality monitoring system designed to help
              communities stay informed about their local air quality. Using advanced sensors and machine learning, we
              provide accurate, up-to-date information about air pollutants and environmental conditions.
            </p>
            <Button asChild variant="link" className="px-0 text-primary hover:text-primary/80">
              <Link href="/about">Learn more about our mission →</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
