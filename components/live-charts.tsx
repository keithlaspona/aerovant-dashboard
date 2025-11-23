"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Calendar } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { SensorReading } from "@/lib/types"

const MAX_DATA_POINTS = 20

export function LiveCharts() {
  const [liveData, setLiveData] = useState<SensorReading[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    console.log("[v0] LiveCharts: Component mounted, setting up interval")

    // Fetch initial data
    fetchLiveData()

    // Set up interval to fetch data every 5 seconds
    const interval = setInterval(fetchLiveData, 5000)

    return () => {
      clearInterval(interval)
      console.log("[v0] LiveCharts: Component unmounting, clearing interval")
    }
  }, [])

  const fetchLiveData = async () => {
    try {
      const response = await fetch(`/api/sensor-data?t=${Date.now()}`)

      if (!response.ok) {
        console.log("[v0] LiveCharts: Failed to fetch data, status:", response.status)
        return
      }

      const data = await response.json()
      console.log("[v0] LiveCharts: Fetched data:", JSON.stringify(data).substring(0, 100))

      if (data && data.timestamp && data.environment) {
        setLiveData((prev) => {
          const newData = [...prev, data]
          const trimmed = newData.slice(-MAX_DATA_POINTS)
          console.log("[v0] LiveCharts: State updated, new total points:", trimmed.length)
          return trimmed
        })
      } else {
        console.log("[v0] LiveCharts: Invalid data structure, missing timestamp or environment")
      }
    } catch (error) {
      console.error("[v0] LiveCharts: Error fetching live data:", error)
    }
  }

  const downloadLiveData = async () => {
    try {
      const response = await fetch("/api/sensor-data")
      const data = await response.json()

      if (data) {
        const jsonData = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonData], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `aerovant_live_data_${new Date().toISOString()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error downloading live data:", error)
      alert("Failed to download data")
    }
  }

  const downloadRangeData = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates")
      return
    }

    try {
      const response = await fetch(`/api/sensor-data-range?start=${startDate}&end=${endDate}`)
      const data = await response.json()

      if (data && data.length > 0) {
        const jsonData = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonData], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `aerovant_data_${startDate}_to_${endDate}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        alert("No data available for the selected date range")
      }
    } catch (error) {
      console.error("Error downloading range data:", error)
      alert("Failed to download data")
    }
  }

  const gasChartData = liveData.map((reading) => {
    try {
      return {
        time: new Date(reading.timestamp).toLocaleTimeString(),
        MQ135: reading.readings?.MQ135_ppm || 0,
        MQ2: reading.readings?.MQ2_ppm || 0,
        MQ3: reading.readings?.MQ3_ppm || 0,
        MQ6: reading.readings?.MQ6_ppm || 0,
        MQ9: reading.readings?.MQ9_ppm || 0,
      }
    } catch {
      return { time: "", MQ135: 0, MQ2: 0, MQ3: 0, MQ6: 0, MQ9: 0 }
    }
  })

  const envChartData = liveData.map((reading) => {
    try {
      return {
        time: new Date(reading.timestamp).toLocaleTimeString(),
        Temperature: reading.environment?.temperature || 0,
        Humidity: reading.environment?.humidity || 0,
      }
    } catch {
      return { time: "", Temperature: 0, Humidity: 0 }
    }
  })

  console.log(
    "[v0] LiveCharts: About to render with",
    liveData.length,
    "data points | gasChartData length:",
    gasChartData.length,
    "| envChartData length:",
    envChartData.length,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Gas Sensors</CardTitle>
          <CardDescription>Real-time gas sensor readings (updates every 5 seconds)</CardDescription>
        </CardHeader>
        <CardContent>
          {gasChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">Waiting for data...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gasChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="MQ135" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="MQ2" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="MQ3" stroke="#eab308" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="MQ6" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="MQ9" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Environment Data</CardTitle>
          <CardDescription>Real-time temperature and humidity readings</CardDescription>
        </CardHeader>
        <CardContent>
          {envChartData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Waiting for data... (fetching from sensor every 5 seconds)
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={envChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Temperature" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Humidity" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Data
          </CardTitle>
          <CardDescription>Export sensor data for analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={downloadLiveData} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Download Current Live Data
            </Button>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Download Date Range
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date & Time</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date & Time</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={downloadRangeData} variant="outline" className="w-full gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Download Range Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
