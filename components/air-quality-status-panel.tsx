"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SensorReading } from "@/lib/types"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface AirQualityStatusPanelProps {
  data: SensorReading | null
}

export function AirQualityStatusPanel({ data }: AirQualityStatusPanelProps) {
  if (!data) {
    return (
      <Card className="h-full rounded-2xl" style={{ backgroundColor: "#626e80" }}>
        <CardHeader>
          <CardTitle className="text-white">Air Quality Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/70">No data available</p>
        </CardContent>
      </Card>
    )
  }

  const temperature = data.environment.temperature
  const humidity = data.environment.humidity
  const envIndex = data.environment.env_index ?? 0

  const gasReadings = [
    { name: "MQ135", ppm: data.readings.MQ135_ppm },
    { name: "MQ2", ppm: data.readings.MQ2_ppm },
    { name: "MQ3", ppm: data.readings.MQ3_ppm },
    { name: "MQ6", ppm: data.readings.MQ6_ppm },
    { name: "MQ9", ppm: data.readings.MQ9_ppm },
  ]

  const maxSensorValue = Math.max(...gasReadings.map((reading) => reading.ppm))
  const adjustedMax = Math.ceil(maxSensorValue + 10)

  // Calculate nice tick interval (10, 20, 25, 50, 100, etc.)
  const niceIntervals = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000]
  let tickInterval = 10
  for (const interval of niceIntervals) {
    if (adjustedMax / interval <= 6) {
      tickInterval = interval
      break
    }
  }

  const dynamicMax = Math.ceil(adjustedMax / tickInterval) * tickInterval
  const dynamicTicks = Array.from({ length: Math.floor(dynamicMax / tickInterval) + 1 }, (_, i) => i * tickInterval)

  // Calculate thermometer fill percentage (0-40°C range)
  const tempPercentage = Math.min(Math.max((temperature / 40) * 100, 0), 100)

  return (
    <Card className="h-full rounded-2xl" style={{ backgroundColor: "#626e80" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg font-bold">Air Quality Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[1fr_1fr_auto] grid-rows-[auto_1fr] gap-3">
          <div
            className="rounded-xl py-2 px-3 flex flex-col items-center justify-center max-h-36 -mt-5"
            style={{ backgroundColor: "#626e80" }}
          >
            <p
              className="text-white/80 text-sm font-medium mb-0.5 bg-white rounded-full px-2 py-0.5 -mt-2.5"
              style={{ color: "#343f56" }}
            >
              ENV Index
            </p>
            <p className="text-white text-6xl font-bold mt-5">{envIndex.toFixed(1)}</p>
          </div>

          {/* Top Center: Humidity Teardrop */}
          <div className="flex flex-col items-center justify-center -ml-[50px]">
            <p
              className="text-base font-semibold text-white mb-2 bg-white rounded-full px-2 py-0.5"
              style={{ color: "#343f56" }}
            >
              Humidity
            </p>
            <div className="relative w-40 h-24 flex items-center justify-center">
              <svg viewBox="0 0 120 115" className="w-full h-full">
                <defs>
                  <clipPath id="teardrop-clip">
                    <path d="M 60 10 Q 40 25 30 45 Q 25 55 25 65 Q 25 80 40 90 Q 50 98 60 98 Q 70 98 80 90 Q 95 80 95 65 Q 95 55 90 45 Q 80 25 60 10 Z" />
                  </clipPath>
                </defs>

                <path
                  d="M 60 10 Q 40 25 30 45 Q 25 55 25 65 Q 25 80 40 90 Q 50 98 60 98 Q 70 98 80 90 Q 95 80 95 65 Q 95 55 90 45 Q 80 25 60 10 Z"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                <path
                  d="M 60 10 Q 40 25 30 45 Q 25 55 25 65 Q 25 80 40 90 Q 50 98 60 98 Q 70 98 80 90 Q 95 80 95 65 Q 95 55 90 45 Q 80 25 60 10 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <rect
                  x="15"
                  y={Math.max(98 - (humidity / 100) * 88, 10)}
                  width="90"
                  height={Math.max((humidity / 100) * 88, 0)}
                  fill="#99a5ac"
                  clipPath="url(#teardrop-clip)"
                />
              </svg>

              <div className="absolute -right-3 top-1/2 -translate-y-1/2">
                <p className="text-2xl font-bold text-white">{humidity.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          <div className="row-span-2 flex flex-col items-center justify-start -mt-2">
            <p
              className="text-base font-semibold text-white mb-3 bg-white rounded-full px-2 py-0.5"
              style={{ color: "#343f56" }}
            >
              Temp
            </p>
            <div className="relative">
              <div className="w-6 h-[340px] bg-white rounded-full relative overflow-hidden">
                <div
                  className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[12px] transition-all duration-300 rounded-full"
                  style={{
                    height: `calc(${tempPercentage}% - 12px)`,
                    backgroundColor: "#004369",
                  }}
                />
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white flex items-center justify-center">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: "#004369" }} />
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <p className="text-sm font-bold text-white">{temperature.toFixed(1)}°C</p>
              </div>
              <div className="absolute -right-6 top-0 h-[340px] flex flex-col justify-between text-[10px] text-white/70">
                <span>40°</span>
                <span>20°</span>
                <span>0°</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-2">
            <p
              className="text-base font-semibold text-white bg-white rounded-full px-2 py-0.5 inline-block"
              style={{ color: "#343f56" }}
            >
              Gas Sensors (PPM)
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gasReadings} margin={{ top: 10, right: 20, left: -15, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#ffffff", fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: "#ffffff" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, dynamicMax]}
                  ticks={dynamicTicks}
                  tick={{ fill: "#ffffff", fontSize: 6 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="ppm" fill="#ffffff" radius={[4, 4, 0, 0]} maxBarSize={65} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
