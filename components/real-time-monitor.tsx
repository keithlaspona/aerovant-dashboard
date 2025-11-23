"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { SensorReading } from "@/lib/types"
import { getAirQualityLevel, getAirQualityColor, formatTimestamp } from "@/lib/utils"
import { RefreshCw, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface RealTimeMonitorProps {
  initialData: SensorReading | null
}

export function RealTimeMonitor({ initialData }: RealTimeMonitorProps) {
  const [data, setData] = useState<SensorReading | null>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/sensor-data")
      if (response.ok) {
        const newData = await response.json()
        setData(newData)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            Real-Time Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Waiting for sensor data...</p>
        </CardContent>
      </Card>
    )
  }

  const airQualityLevel = getAirQualityLevel(data.readings.MQ135_ppm)
  const colorClass = getAirQualityColor(airQualityLevel)
  const predictionLabel =
    typeof data.ml_prediction.classification === "number"
      ? data.ml_prediction.classification === 1
        ? "Stable"
        : "Critical"
      : data.ml_prediction.classification

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            Real-Time Monitor
          </CardTitle>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Last updated: {formatTimestamp(lastUpdate.toISOString())}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border-2 border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Status</p>
              <p className="text-3xl font-bold text-foreground">{airQualityLevel}</p>
            </div>
            <Badge className={cn("text-lg px-4 py-2 border-2", colorClass)}>{predictionLabel}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border-2 border-border">
              <p className="text-xs text-muted-foreground mb-1">Temperature</p>
              <p className="text-xl font-bold text-foreground">{data.environment.temperature.toFixed(1)}°C</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border-2 border-border">
              <p className="text-xs text-muted-foreground mb-1">Humidity</p>
              <p className="text-xl font-bold text-foreground">{data.environment.humidity.toFixed(1)}%</p>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              AI-Powered Assessment
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-sm font-semibold border-2", colorClass)}>
                {predictionLabel}
              </Badge>
              <p className="text-xs text-muted-foreground">Based on real-time sensor analysis</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
