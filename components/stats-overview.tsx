import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SensorReading } from "@/lib/types"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatsOverviewProps {
  sensorData: SensorReading | null
}

export function StatsOverview({ sensorData }: StatsOverviewProps) {
  if (!sensorData || !sensorData.readings || !sensorData.environment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: "Air Quality Index",
      value: Math.round(sensorData.readings.MQ135_ppm || 0),
      trend: "stable" as const,
      change: "0%",
    },
    {
      label: "Temperature",
      value: `${(sensorData.environment.temperature || 0).toFixed(1)}°C`,
      trend: "up" as const,
      change: "+2%",
    },
    {
      label: "Humidity",
      value: `${(sensorData.environment.humidity || 0).toFixed(1)}%`,
      trend: "down" as const,
      change: "-5%",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {stat.trend === "up" && (
                <>
                  <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">{stat.change}</span>
                </>
              )}
              {stat.trend === "down" && (
                <>
                  <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">{stat.change}</span>
                </>
              )}
              {stat.trend === "stable" && (
                <>
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{stat.change}</span>
                </>
              )}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-1">AI Prediction</p>
          <p className="text-lg font-semibold text-primary">
            {sensorData.ml_prediction?.classification !== undefined
              ? typeof sensorData.ml_prediction.classification === "number"
                ? sensorData.ml_prediction.classification === 1
                  ? "Stable"
                  : "Critical"
                : sensorData.ml_prediction.classification
              : "N/A"}
          </p>
          {sensorData.ml_prediction?.confidence && (
            <p className="text-xs text-muted-foreground">
              Confidence: {(sensorData.ml_prediction.confidence * 100).toFixed(1)}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
