import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CitizenReport } from "@/lib/types"
import { formatTimestamp, getReportTypeLabel, getStatusColor } from "@/lib/utils"
import { MapPin, Clock } from "lucide-react"

interface RecentActivityProps {
  reports: CitizenReport[]
}

export function RecentActivity({ reports }: RecentActivityProps) {
  const sortedReports = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedReports.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {sortedReports.map((report) => (
              <div
                key={report.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {getReportTypeLabel(report.report_type)}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(report.status)}`}>{report.status}</Badge>
                  </div>

                  <p className="text-sm text-foreground mb-2 line-clamp-2">{report.notes}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(report.timestamp)}
                    </span>
                  </div>

                  {report.reporter_name && (
                    <p className="text-xs text-muted-foreground mt-1">Reported by: {report.reporter_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
