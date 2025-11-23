import { Navigation } from "@/components/navigation"
import { getAllCitizenReports } from "@/lib/firebase-service"
import { ReportsManagement } from "@/components/reports-management"

export const dynamic = "force-dynamic"

export default async function ManageReportsPage() {
  const reports = await getAllCitizenReports()

  return (
    <div className="min-h-screen bg-background">
      <Navigation role="stakeholder" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Manage Reports</h1>
          <p className="text-muted-foreground text-lg">Review and manage citizen-submitted air quality reports</p>
        </div>

        <ReportsManagement reports={reports} />
      </main>
    </div>
  )
}
