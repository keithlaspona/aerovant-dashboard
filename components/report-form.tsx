"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitCitizenReport } from "@/lib/firebase-service"
import { useRouter } from "next/navigation"
import { Loader2, Send } from "lucide-react"
import { LocationPicker } from "./location-picker"
import { useToast } from "@/components/ui/toast"

export function ReportForm() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    report_type: "smoke" as "smoke" | "odor" | "dust" | "other",
    notes: "",
    reporter_name: "",
    reporter_contact: "",
    reporter_phone: "",
  })

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address || prev.location || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.latitude || !formData.longitude) {
      addToast({
        title: "Location Required",
        description: "Please select a location on the map before submitting.",
        variant: "error",
      })
      return
    }

    setLoading(true)

    try {
      const reportData: any = {
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        report_type: formData.report_type,
        notes: formData.notes,
      }

      // Only include optional fields if they have values
      if (formData.reporter_name.trim()) {
        reportData.reporter_name = formData.reporter_name.trim()
      }
      if (formData.reporter_contact.trim()) {
        reportData.reporter_contact = formData.reporter_contact.trim()
      }
      if (formData.reporter_phone.trim()) {
        reportData.reporter_phone = formData.reporter_phone.trim()
      }

      const success = await submitCitizenReport(reportData)

      if (success) {
        addToast({
          title: "Report Submitted Successfully!",
          description: "Thank you for helping us monitor air quality. We'll investigate this matter shortly.",
          variant: "success",
        })
        setFormData({
          location: "",
          latitude: null,
          longitude: null,
          report_type: "smoke",
          notes: "",
          reporter_name: "",
          reporter_contact: "",
          reporter_phone: "",
        })
        router.refresh()
      } else {
        addToast({
          title: "Submission Failed",
          description: "Failed to submit report. Please try again.",
          variant: "error",
        })
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      addToast({
        title: "Error Occurred",
        description: "An error occurred while submitting your report. Please try again.",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LocationPicker
        onLocationSelect={handleLocationSelect}
        initialLat={formData.latitude || undefined}
        initialLng={formData.longitude || undefined}
      />

      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle>Report Details</CardTitle>
          <CardDescription>Provide information about the air quality issue you observed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="location">Location Description *</Label>
            <Input
              id="location"
              placeholder="e.g., Near USTP Main Gate, Lapasan"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              required
              className="border-primary/20"
            />
            <p className="text-xs text-muted-foreground">This field auto-fills when you select a location on the map</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report_type">Issue Type *</Label>
            <Select
              value={formData.report_type}
              onValueChange={(value: any) => setFormData((prev) => ({ ...prev, report_type: value }))}
            >
              <SelectTrigger className="border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smoke">Smoke</SelectItem>
                <SelectItem value="odor">Unusual Odor</SelectItem>
                <SelectItem value="dust">Dust/Particulates</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Description *</Label>
            <Textarea
              id="notes"
              placeholder="Describe what you observed in detail..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              required
              rows={4}
              className="border-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporter_name">Your Name (Optional)</Label>
            <Input
              id="reporter_name"
              placeholder="John Doe"
              value={formData.reporter_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, reporter_name: e.target.value }))}
              className="border-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporter_contact">Contact Email (Optional)</Label>
            <Input
              id="reporter_contact"
              type="email"
              placeholder="john@example.com"
              value={formData.reporter_contact}
              onChange={(e) => setFormData((prev) => ({ ...prev, reporter_contact: e.target.value }))}
              className="border-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporter_phone">Contact Phone (Optional)</Label>
            <Input
              id="reporter_phone"
              type="tel"
              placeholder="+63 912 345 6789"
              value={formData.reporter_phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, reporter_phone: e.target.value }))}
              className="border-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              Providing your phone number helps us send you updates about your report
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-lg">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Report...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
