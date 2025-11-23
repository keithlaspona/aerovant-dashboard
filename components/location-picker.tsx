"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2, Navigation } from "lucide-react"

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  initialLat?: number
  initialLng?: number
}

export function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
  const [loading, setLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  )
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Load Leaflet CSS and JS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.async = true
    script.onload = () => {
      setMapLoaded(true)
      initMap()
    }
    document.head.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (mapLoaded && !mapInstanceRef.current) {
      initMap()
    }
  }, [mapLoaded])

  const initMap = () => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) return

    const defaultCenter: [number, number] = selectedLocation
      ? [selectedLocation.lat, selectedLocation.lng]
      : [8.486071, 124.656805] // USTP coordinates

    mapInstanceRef.current = window.L.map(mapRef.current).setView(defaultCenter, 15)

    // Add OpenStreetMap tiles
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current)

    // Add click listener to map
    mapInstanceRef.current.on("click", async (e: any) => {
      const lat = e.latlng.lat
      const lng = e.latlng.lng

      const address = await reverseGeocode(lat, lng)

      setSelectedLocation({ lat, lng, address })
      onLocationSelect(lat, lng, address)
      updateMarker(lat, lng)
    })

    // Add initial marker if location is set
    if (selectedLocation) {
      updateMarker(selectedLocation.lat, selectedLocation.lng)
    }
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)

      if (!response.ok) {
        throw new Error("Geocoding failed")
      }

      const data = await response.json()

      if (data.display_name) {
        return data.display_name
      }
      return data.coordinates || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  const updateMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current || !window.L) return

    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current)
    }

    // Add new marker with custom icon
    const customIcon = window.L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    markerRef.current = window.L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current)

    // Center map on marker
    mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom())
  }

  const handleGetCurrentLocation = async () => {
    setLoading(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          const address = await reverseGeocode(lat, lng)

          setSelectedLocation({ lat, lng, address })
          onLocationSelect(lat, lng, address)
          updateMarker(lat, lng)
          setLoading(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLoading(false)
          alert("Unable to get your location. Please click on the map to select a location.")
        },
      )
    } else {
      setLoading(false)
      alert("Geolocation is not supported by your browser")
    }
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Select Location
        </CardTitle>
        <CardDescription>Click on the map to pin your exact location or use your current location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div ref={mapRef} className="w-full h-[400px] rounded-lg border-2 border-border shadow-inner" />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Use Current Location
              </>
            )}
          </Button>
        </div>

        {selectedLocation && (
          <div className="text-sm bg-gradient-to-br from-primary/5 to-accent/5 p-4 rounded-lg border border-primary/20">
            <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Selected Location:
            </p>
            {selectedLocation.address && <p className="text-muted-foreground mb-2">{selectedLocation.address}</p>}
            <p className="text-xs text-muted-foreground">
              Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Add TypeScript declaration for Leaflet
declare global {
  interface Window {
    L: any
  }
}
