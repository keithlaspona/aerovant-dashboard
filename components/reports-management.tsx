"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { CitizenReport } from "@/lib/types"
import { formatTimestamp, getReportTypeLabel, getReportStatusColor } from "@/lib/utils"
import {
  MapPin,
  Clock,
  User,
  Mail,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Rocket,
  Phone,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"

interface ReportsManagementProps {
  reports: CitizenReport[]
}

export function ReportsManagement({ reports: initialReports }: ReportsManagementProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const [reports, setReports] = useState(initialReports)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [hideResolved, setHideResolved] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deploymentNotes, setDeploymentNotes] = useState<Record<string, string>>({})
  const [messageText, setMessageText] = useState<Record<string, string>>({})
  const [sendingMessage, setSendingMessage] = useState<string | null>(null)

  const filteredReports = reports
    .filter((report) => {
      if (filterStatus !== "all" && report.status !== filterStatus) return false
      if (filterType !== "all" && report.report_type !== filterType) return false
      if (hideResolved && report.status === "resolved") return false
      return true
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const handleStatusChange = async (reportId: string, newStatus: CitizenReport["status"]) => {
    setUpdatingId(reportId)
    try {
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: newStatus }),
      })

      if (response.ok) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)))
        addToast({
          title: "Status Updated",
          description: `Report status changed to ${newStatus}`,
          variant: "success",
        })
        router.refresh()
      } else {
        addToast({
          title: "Update Failed",
          description: "Failed to update report status",
          variant: "error",
        })
      }
    } catch (error) {
      console.error("Error updating report:", error)
      addToast({
        title: "Error",
        description: "An error occurred while updating the report",
        variant: "error",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeploymentToggle = async (reportId: string, deployed: boolean) => {
    setUpdatingId(reportId)
    try {
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          deployed,
          deployment_date: deployed ? new Date().toISOString() : null,
          deployment_notes: deployed ? deploymentNotes[reportId] || "" : null,
        }),
      })

      if (response.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  deployed,
                  deployment_date: deployed ? new Date().toISOString() : undefined,
                  deployment_notes: deployed ? deploymentNotes[reportId] || "" : undefined,
                }
              : r,
          ),
        )
        addToast({
          title: deployed ? "Sensor Deployed" : "Deployment Removed",
          description: deployed
            ? "Citizens can now see that a sensor has been deployed for this report"
            : "Deployment status removed",
          variant: "success",
        })
        router.refresh()
      } else {
        addToast({
          title: "Update Failed",
          description: "Failed to update deployment status",
          variant: "error",
        })
      }
    } catch (error) {
      console.error("Error updating deployment:", error)
      addToast({
        title: "Error",
        description: "An error occurred while updating deployment status",
        variant: "error",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      return
    }

    setDeletingId(reportId)
    try {
      const response = await fetch(`/api/reports?id=${reportId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId))
        addToast({
          title: "Report Deleted",
          description: "The report has been successfully deleted",
          variant: "success",
        })
        router.refresh()
      } else {
        addToast({
          title: "Delete Failed",
          description: "Failed to delete the report",
          variant: "error",
        })
      }
    } catch (error) {
      console.error("Error deleting report:", error)
      addToast({
        title: "Error",
        description: "An error occurred while deleting the report",
        variant: "error",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleSendMessage = async (reportId: string) => {
    const message = messageText[reportId]?.trim()
    if (!message) {
      addToast({
        title: "Message Required",
        description: "Please enter a message to send",
        variant: "error",
      })
      return
    }

    setSendingMessage(reportId)
    try {
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          addMessage: {
            message,
            timestamp: new Date().toISOString(),
            sender: "stakeholder",
          },
        }),
      })

      if (response.ok) {
        const updatedReport = await response.json()
        setReports((prev) => prev.map((r) => (r.id === reportId ? updatedReport : r)))
        setMessageText((prev) => ({ ...prev, [reportId]: "" }))
        addToast({
          title: "Message Sent",
          description: "Your message has been sent to the citizen",
          variant: "success",
        })
        router.refresh()
      } else {
        addToast({
          title: "Send Failed",
          description: "Failed to send message",
          variant: "error",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      addToast({
        title: "Error",
        description: "An error occurred while sending the message",
        variant: "error",
      })
    } finally {
      setSendingMessage(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="smoke">Smoke</SelectItem>
                  <SelectItem value="odor">Unusual Odor</SelectItem>
                  <SelectItem value="dust">Dust/Particulates</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Display</label>
              <div className="flex items-center gap-2 h-10">
                <Checkbox
                  id="hide-resolved"
                  checked={hideResolved}
                  onCheckedChange={(checked) => setHideResolved(checked as boolean)}
                />
                <Label htmlFor="hide-resolved" className="cursor-pointer">
                  Hide resolved reports
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card className="border-2 border-primary/20">
            <CardContent className="py-12">
              <p className="text-muted-foreground text-center">No reports match the selected filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card
              key={report.id}
              className="hover:shadow-lg transition-all border-2 border-border hover:border-primary/30"
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-semibold border-primary/30">
                        {getReportTypeLabel(report.report_type)}
                      </Badge>
                      <Badge className={getReportStatusColor(report.status)}>{report.status}</Badge>
                      {report.deployed && (
                        <Badge className="bg-green-500 text-white border-green-600">
                          <Rocket className="w-3 h-3 mr-1" />
                          Sensor Deployed
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => report.id && handleDelete(report.id)}
                      disabled={deletingId === report.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === report.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div>
                    <p className="text-foreground leading-relaxed">{report.notes}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
                        <span>{report.location}</span>
                      </div>
                      {report.latitude && report.longitude && (
                        <div className="text-xs text-muted-foreground ml-6">
                          {Number(report.latitude).toFixed(6)}, {Number(report.longitude).toFixed(6)}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 flex-shrink-0 text-primary" />
                        <span>{formatTimestamp(report.timestamp)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {report.reporter_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4 flex-shrink-0 text-primary" />
                          <span>{report.reporter_name}</span>
                        </div>
                      )}
                      {report.reporter_contact && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                          <span>{report.reporter_contact}</span>
                        </div>
                      )}
                      {report.reporter_phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                          <span>{report.reporter_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {report.messages && report.messages.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Message History
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {report.messages.map((msg) => (
                          <div key={msg.id} className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                            <p className="text-foreground">{msg.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(msg.timestamp)} • {msg.sender === "stakeholder" ? "You" : "System"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border space-y-3">
                    <label className="text-sm font-medium text-foreground block flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Send Update to Citizen
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., We have received your report and are investigating..."
                        value={messageText[report.id || ""] || ""}
                        onChange={(e) => setMessageText((prev) => ({ ...prev, [report.id || ""]: e.target.value }))}
                        className="flex-1 border-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            report.id && handleSendMessage(report.id)
                          }
                        }}
                      />
                      <Button
                        onClick={() => report.id && handleSendMessage(report.id)}
                        disabled={sendingMessage === report.id || !messageText[report.id || ""]?.trim()}
                        className="gap-2 bg-primary hover:bg-primary/90"
                      >
                        {sendingMessage === report.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setMessageText((prev) => ({
                            ...prev,
                            [report.id || ""]:
                              "We have received your report and are investigating the matter. Thank you for your patience.",
                          }))
                        }
                        className="text-xs"
                      >
                        Template: Received
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setMessageText((prev) => ({
                            ...prev,
                            [report.id || ""]:
                              "Aerovant sensor has been deployed at your reported location. Please be patient as we collect and analyze air quality data.",
                          }))
                        }
                        className="text-xs"
                      >
                        Template: Deployed
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <label className="text-sm font-medium text-foreground mb-3 block">Update Status</label>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={report.status === "investigating" ? "default" : "outline"}
                        onClick={() => report.id && handleStatusChange(report.id, "investigating")}
                        disabled={updatingId === report.id}
                        className="gap-2 border-primary/30 hover:bg-primary hover:text-primary-foreground"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Investigating
                      </Button>
                      <Button
                        size="sm"
                        variant={report.status === "resolved" ? "default" : "outline"}
                        onClick={() => report.id && handleStatusChange(report.id, "resolved")}
                        disabled={updatingId === report.id}
                        className="gap-2 border-primary/30 hover:bg-primary hover:text-primary-foreground"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant={report.status === "dismissed" ? "default" : "outline"}
                        onClick={() => report.id && handleStatusChange(report.id, "dismissed")}
                        disabled={updatingId === report.id}
                        className="gap-2 border-primary/30 hover:bg-primary hover:text-primary-foreground"
                      >
                        <XCircle className="w-4 h-4" />
                        Dismissed
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-3">
                    <label className="text-sm font-medium text-foreground block">Sensor Deployment</label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`deployed-${report.id}`}
                        checked={report.deployed || false}
                        onCheckedChange={(checked) =>
                          report.id && handleDeploymentToggle(report.id, checked as boolean)
                        }
                        disabled={updatingId === report.id}
                      />
                      <Label htmlFor={`deployed-${report.id}`} className="text-sm cursor-pointer">
                        Mark as sensor deployed (visible to citizens)
                      </Label>
                    </div>
                    {!report.deployed && (
                      <Textarea
                        placeholder="Optional: Add deployment notes..."
                        value={deploymentNotes[report.id || ""] || ""}
                        onChange={(e) => setDeploymentNotes((prev) => ({ ...prev, [report.id || ""]: e.target.value }))}
                        className="text-sm border-primary/20"
                        rows={2}
                      />
                    )}
                    {report.deployed && report.deployment_notes && (
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border border-primary/20">
                        <p className="font-medium mb-1">Deployment Notes:</p>
                        <p>{report.deployment_notes}</p>
                        {report.deployment_date && (
                          <p className="text-xs mt-2">Deployed: {formatTimestamp(report.deployment_date)}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
