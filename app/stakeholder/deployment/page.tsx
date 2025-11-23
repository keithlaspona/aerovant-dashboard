import { Navigation } from "@/components/navigation"
import { DeploymentStatus } from "@/components/deployment-status"

export default function DeploymentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <Navigation role="stakeholder" />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Deployment Tracking</h1>
            <p className="text-muted-foreground text-lg">
              Monitor the progress of Aerovant system deployment across all phases
            </p>
          </div>

          <DeploymentStatus />
        </div>
      </main>
    </div>
  )
}
