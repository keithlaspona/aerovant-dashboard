import { Navigation } from "@/components/navigation"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { NearbyReportsFinder } from "@/components/nearby-reports-finder"
import { getSensorDataInRange, SENSOR_LOCATION } from "@/lib/firebase-service"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  // Get data for the last 7 days
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  const historicalData = await getSensorDataInRange(startDate, endDate)

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="stakeholder" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Analytics</h1>
          <p className="text-muted-foreground text-lg">Historical air quality data and trends</p>
        </div>

        <div className="mb-6">
          <AnalyticsCharts data={historicalData} />
        </div>

        <NearbyReportsFinder sensorLat={SENSOR_LOCATION.latitude} sensorLng={SENSOR_LOCATION.longitude} />
      </main>
    </div>
  )
}
