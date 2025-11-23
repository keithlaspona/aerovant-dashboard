"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Thermometer, Droplets, Activity, Flame } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { SensorReading } from "@/lib/types"
import { getAirQualityStatus, getStatusColor, formatTimestamp } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface AirQualityCardProps {
  data: SensorReading | null
}

export function AirQualityCard({ data }: AirQualityCardProps) {
  if (!data) {
    return (
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>Air Quality Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  if (!data.ml_prediction || data.ml_prediction.classification === undefined) {
    return (
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>Air Quality Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading data...</p>
        </CardContent>
      </Card>
    )
  }

  const airQualityStatus = getAirQualityStatus(data.ml_prediction.classification)
  const colorClass = getStatusColor(airQualityStatus)

  const gasData = [
    { name: "MQ135", value: data.readings.MQ135_ppm },
    { name: "MQ2", value: data.readings.MQ2_ppm },
    { name: "MQ3", value: data.readings.MQ3_ppm },
    { name: "MQ6", value: data.readings.MQ6_ppm },
    { name: "MQ9", value: data.readings.MQ9_ppm },
  ]

  return (
    <Card className="overflow-hidden border-2 border-border hover:shadow-lg transition-shadow">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Air Quality Status
          </CardTitle>
          <Badge className={cn("text-base font-bold border-2 px-4 py-1", colorClass)}>{airQualityStatus}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Last updated: {formatTimestamp(data.timestamp)}</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex gap-6">
          {/* Bar Chart Section - 70% */}
          <div className="flex-[0_0_68%]">
            <h4 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Gas Sensors (ppm)
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gasData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="glowBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7BBDE8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#4E8EA2" stopOpacity={0.8} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value.toFixed(2)}      PPM`, "Value"]}
                />
                <Bar dataKey="value" fill="url(#glowBlue)" radius={[8, 8, 0, 0]} filter="url(#glow)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Temperature & Humidity Section - 30% */}
          <div className="flex-[0_0_30%] flex flex-col gap-4 pl-2">
            {/* Temperature Card */}
            <Card className="border border-border bg-card/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Thermometer className="w-4 h-4" />
                    Temperature
                  </p>
                  <p className="text-4xl font-bold text-foreground">{data.environment.temperature.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">°C</p>
                </div>
              </CardContent>
            </Card>

            {/* Humidity Card */}
            <Card className="border border-border bg-card/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    Humidity
                  </p>
                  <p className="text-4xl font-bold text-foreground">{data.environment.humidity.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
