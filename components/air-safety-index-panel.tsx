"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SensorReading } from "@/lib/types"
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react"

interface AirSafetyIndexPanelProps {
  initialData: SensorReading | null
}

export function AirSafetyIndexPanel({ initialData }: AirSafetyIndexPanelProps) {
  const [data, setData] = useState<SensorReading | null>(initialData)
  const [timeAgo, setTimeAgo] = useState<string>("")

  useEffect(() => {
    if (initialData) {
      setData(initialData)
    }
  }, [initialData])

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!data) return

      const now = new Date()
      const timestamp = new Date(data.timestamp)
      const diffMs = now.getTime() - timestamp.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)

      if (diffMins < 1) {
        setTimeAgo("just now")
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minute${diffMins > 1 ? "s" : ""} ago`)
      } else {
        setTimeAgo(`${diffHours} hour${diffHours > 1 ? "s" : ""} ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 60000)

    return () => clearInterval(interval)
  }, [data])

  if (!data) {
    return (
      <Card className="h-full rounded-2xl" style={{ backgroundColor: "#c9cfcf" }}>
        <CardHeader>
          <CardTitle className="text-black font-bold">Air Safety Index</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-black/70">Waiting for data...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data.ml_prediction) {
    return (
      <Card className="h-full rounded-2xl" style={{ backgroundColor: "#c9cfcf" }}>
        <CardHeader>
          <CardTitle className="text-black font-bold">Air Safety Index</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-black/70">ML prediction data unavailable</p>
        </CardContent>
      </Card>
    )
  }

  const isStable = data.ml_prediction.classification === 1 || data.ml_prediction.classification === "Stable"
  const predictionLabel =
    typeof data.ml_prediction.classification === "number"
      ? data.ml_prediction.classification === 1
        ? "Stable"
        : "Critical"
      : data.ml_prediction.classification
  const statusMessage = isStable
    ? "Gas levels detected are below harmful thresholds; the area is safe."
    : "Critical gas levels detected. All activity in this area must cease immediately."

  return (
    <Card className="h-full rounded-2xl" style={{ backgroundColor: "#c9cfcf" }}>
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-bold tracking-tighter text-[rgba(52,63,86,1)]">Air Safety Index</CardTitle>
        <div className="flex items-center gap-2 text-xs text-black/70">
          <Clock className="w-3 h-3" />
          <span>{new Date(data.timestamp).toLocaleString()}</span>
        </div>
        <p className="text-[10px] text-black/60 mb-0">{timeAgo}</p>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0 -mt-[13px]">
        <div className="bg-white rounded-lg p-4 space-y-1.5 font-mono text-xs border-2 border-black/10">
          <div className="flex justify-between border-b border-dashed border-black/20 pb-1.5">
            <span className="text-black/70">MQ135</span>
            <span className="font-semibold text-black">{data.readings.MQ135_ppm.toFixed(2)} PPM</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-black/20 pb-1.5">
            <span className="text-black/70">MQ2</span>
            <span className="font-semibold text-black">{data.readings.MQ2_ppm.toFixed(2)} PPM</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-black/20 pb-1.5">
            <span className="text-black/70">MQ3</span>
            <span className="font-semibold text-black">{data.readings.MQ3_ppm.toFixed(2)} PPM</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-black/20 pb-1.5">
            <span className="text-black/70">MQ6</span>
            <span className="font-semibold text-black">{data.readings.MQ6_ppm.toFixed(2)} PPM</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-black/20 pb-1.5">
            <span className="text-black/70">MQ9</span>
            <span className="font-semibold text-black">{data.readings.MQ9_ppm.toFixed(2)} PPM</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-black/20 pb-1.5">
            <span className="text-black/70">Humidity</span>
            <span className="font-semibold text-black">{data.environment.humidity.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between pb-1.5">
            <span className="text-black/70">Temperature</span>
            <span className="font-semibold text-black">{data.environment.temperature.toFixed(1)}°C</span>
          </div>
        </div>

        <div className="rounded-lg p-4 text-black mt-3" style={{ backgroundColor: "#004369" }}>
          <p className="text-xs uppercase tracking-wide mb-2 opacity-80 text-white">AI Prediction</p>
          <div className="flex items-center gap-2 mb-3">
            {isStable ? (
              <>
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{predictionLabel}</p>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{predictionLabel}</p>
              </>
            )}
          </div>
          {data.ml_prediction.confidence && (
            <p className="text-sm opacity-80 text-white mb-3">
              Confidence: {(data.ml_prediction.confidence * 100).toFixed(0)}%
            </p>
          )}
        </div>
        <p className="text-sm mt-3" style={{ color: "#343f56" }}>
          {statusMessage}
        </p>
      </CardContent>
    </Card>
  )
}
