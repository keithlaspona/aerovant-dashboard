export interface SensorReading {
  timestamp: string
  readings: {
    MQ135_ppm: number
    MQ2_ppm: number
    MQ3_ppm: number
    MQ6_ppm: number
    MQ9_ppm: number
  }
  environment: {
    temperature: number
    humidity: number
    env_index?: number
  }
  ml_prediction: {
    classification: string
    confidence?: number
  }
  location: {
    latitude: number
    longitude: number
  }
}

export interface CitizenReport {
  id?: string
  location_area: string
  latitude?: number
  longitude?: number
  report_type: "smoke" | "odor" | "dust" | "other"
  notes: string
  timestamp: string
  status: "pending" | "investigating" | "resolved" | "dismissed"
  reporter_name?: string
  reporter_contact?: string
  reporter_phone?: string
  distance_km?: number
  deployed?: boolean
  deployment_date?: string
  deployment_notes?: string
  messages?: ReportMessage[]
}

export interface ReportMessage {
  id: string
  message: string
  timestamp: string
  sender: "stakeholder" | "system"
}

export interface User {
  id: string
  email: string
  role: "citizen" | "stakeholder"
  name: string
}

export type AirQualityLevel = "Good" | "Moderate" | "Unhealthy" | "Very Unhealthy" | "Hazardous"
