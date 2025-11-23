"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CitizenReport } from "@/lib/types"
import { SENSOR_LOCATION } from "@/lib/firebase-service"
import { Navigation } from "lucide-react"
import { useEffect, useRef } from "react"

interface InteractiveMapProps {
  reports: CitizenReport[]
}

declare global {
  interface Window {
    L: any
  }
}

export function InteractiveMap({ reports }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const reportsWithLocation = reports.filter((r) => r.latitude && r.longitude)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    // Load Leaflet CSS and JS dynamically
    const leafletCSS = document.createElement("link")
    leafletCSS.rel = "stylesheet"
    leafletCSS.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
    document.head.appendChild(leafletCSS)

    const leafletScript = document.createElement("script")
    leafletScript.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
    leafletScript.async = true
    leafletScript.onload = () => {
      const L = window.L

      const map = L.map(mapContainer.current).setView([SENSOR_LOCATION.latitude, SENSOR_LOCATION.longitude], 15)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      const sensorMarker = L.circleMarker([SENSOR_LOCATION.latitude, SENSOR_LOCATION.longitude], {
        radius: 12,
        fillColor: "#1e40af",
        color: "#1e3a8a",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .bindPopup(`<strong>${SENSOR_LOCATION.name}</strong><br/>Sensor Location`)
        .addTo(map)

      // Add sensor icon
      const sensorIcon = L.divIcon({
        html: `<div style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" width="18" height="18"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#1e40af"/></svg></div>`,
        iconSize: [30, 30],
        className: "",
      })

      L.marker([SENSOR_LOCATION.latitude, SENSOR_LOCATION.longitude], { icon: sensorIcon }).addTo(map)

      reportsWithLocation.forEach((report) => {
        const statusColorMap: Record<string, string> = {
          pending: "#eab308",
          investigating: "#3b82f6",
          resolved: "#22c55e",
          dismissed: "#6b7280",
        }

        const color = statusColorMap[report.status] || "#6b7280"

        L.circleMarker([report.latitude, report.longitude], {
          radius: 8,
          fillColor: color,
          color: "white",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .bindPopup(
            `<strong>${report.report_type}</strong><br/>
            Status: ${report.status}<br/>
            Location: ${report.location_area || "Unknown"}`,
          )
          .addTo(map)
      })

      mapRef.current = map
    }
    document.body.appendChild(leafletScript)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [reportsWithLocation])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "investigating":
        return "bg-blue-500"
      case "resolved":
        return "bg-green-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Location Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Map Container */}
        <div ref={mapContainer} className="w-full h-96 rounded-lg overflow-hidden border border-border mb-4" />

        {/* Legend */}
        <div className="bg-card border border-border rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-2">Legend:</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-foreground">Investigating</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-foreground">Resolved</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Showing {reportsWithLocation.length} reports with location data
        </p>
      </CardContent>
    </Card>
  )
}
