"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, X } from "lucide-react"
import type { CitizenReport } from "@/lib/types"
import { formatTimestamp, getReportTypeLabel } from "@/lib/utils"

interface NearbyReportsFinderProps {
  sensorLat: number
  sensorLng: number
}

export function NearbyReportsFinder({ sensorLat, sensorLng }: NearbyReportsFinderProps) {
  const [reports, setReports] = useState<(CitizenReport & { distance_km: number })[]>([])
  const [loading, setLoading] = useState(false)
  const [showReports, setShowReports] = useState(false)

  const findNearbyReports = async () => {
    setLoading(true)
    setShowReports(true)

    try {
      const response = await fetch(`/api/nearby-reports?lat=${sensorLat}&lon=${sensorLng}&radius=10`)

      if (!response.ok) {
        throw new Error(`Failed to fetch nearby reports: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setReports(data)
    } catch (error) {
      console.error("[v0] Error fetching nearby reports:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Nearby Reports
        </CardTitle>
        <CardDescription>Find citizen reports within 10km of the sensor location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={findNearbyReports} disabled={loading} className="w-full gap-2">
          {loading ? (
            <>Loading...</>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Find Nearby Reports
            </>
          )}
        </Button>

        {showReports && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">
                {reports.length} {reports.length === 1 ? "Report" : "Reports"} Found
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setShowReports(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {reports.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No reports found within 10km</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {reports.map((report, index) => (
                  <Card key={report.id || index} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{getReportTypeLabel(report.report_type)}</Badge>
                          <span className="text-xs text-muted-foreground">{report.distance_km.toFixed(2)} km away</span>
                        </div>
                        <p className="text-sm text-foreground">{report.notes}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{report.location}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(report.timestamp)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
