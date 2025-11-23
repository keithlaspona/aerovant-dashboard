import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CitizenReport, SensorReading } from "@/lib/types"
import { formatTimestamp, getReportTypeLabel, getStatusColor } from "@/lib/utils"
import { MapPin, Clock, Rocket, MessageSquare, User, Phone, Mail, Navigation } from "lucide-react"

interface ReportsListProps {
  reports: CitizenReport[]
  sensorData?: SensorReading | null
  showActions?: boolean
}

export function ReportsList({ reports, sensorData, showActions = false }: ReportsListProps) {
  const sortedReports = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const envIndex = sensorData?.environment?.env_index ?? 0

  React.useEffect &&
    console.log(
      "[v0] ReportsList rendered with ENV Index:",
      envIndex,
      "from sensorData:",
      sensorData?.environment?.env_index,
    )

  return (
    <Card className="border-2 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Reports</CardTitle>
          {sensorData && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#033047" }}>
              <span className="text-white/80 text-sm font-medium">ENV Index:</span>
              <span className="text-white text-lg font-bold" key={`env-${envIndex}`}>
                {envIndex.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sortedReports.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No reports yet</p>
        ) : (
          <div className="space-y-4">
            {sortedReports.slice(0, 10).map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-lg border-2 border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="border-primary/30">
                      {getReportTypeLabel(report.report_type)}
                    </Badge>
                    <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                    {report.deployed && (
                      <Badge className="bg-green-500 text-white border-green-600">
                        <Rocket className="w-3 h-3 mr-1" />
                        Deployed
                      </Badge>
                    )}
                  </div>
                  {report.distance_km !== undefined && (
                    <span className="text-sm text-muted-foreground font-medium">{report.distance_km} km away</span>
                  )}
                </div>

                <div className="mb-4 pb-4 border-b border-border">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p className="text-base text-foreground font-semibold">
                          {report.location_area && report.location_area.trim() ? (
                            report.location_area
                          ) : report.latitude && report.longitude ? (
                            <span className="font-mono text-sm">
                              {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Not specified</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Reported</p>
                        <p className="text-base text-foreground">{formatTimestamp(report.timestamp)}</p>
                      </div>
                    </div>
                    {report.latitude && report.longitude && (
                      <div className="flex items-start gap-2">
                        <Navigation className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Coordinates</p>
                          <p className="text-sm text-foreground font-mono">
                            {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Issue Details</p>
                  <p className="text-base text-foreground leading-relaxed">{report.notes}</p>
                </div>

                {(report.reporter_name || report.reporter_contact || report.reporter_phone) && (
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium text-primary mb-2">Reporter Information</p>
                    <div className="space-y-1 text-sm">
                      {report.reporter_name && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{report.reporter_name}</span>
                        </div>
                      )}
                      {report.reporter_contact && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="break-all">{report.reporter_contact}</span>
                        </div>
                      )}
                      {report.reporter_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{report.reporter_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {report.messages && report.messages.length > 0 && (
                  <div className="mb-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium text-primary mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Latest Update from Stakeholder:
                    </p>
                    <p className="text-base text-foreground">{report.messages[report.messages.length - 1].message}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatTimestamp(report.messages[report.messages.length - 1].timestamp)}
                    </p>
                  </div>
                )}

                {report.deployed && report.deployment_notes && (
                  <div className="mb-2 p-2 bg-green-50 dark:bg-green-950 border border-green-500/30 rounded text-sm text-green-700 dark:text-green-400">
                    <p className="font-medium">Sensor Deployed</p>
                    <p>{report.deployment_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
