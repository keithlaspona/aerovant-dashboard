import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wind, Target, Users, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation role="citizen" />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">About Aerovant</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Real-time air quality monitoring for healthier communities
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Aerovant is an advanced air quality monitoring system designed to provide real-time information about
                environmental conditions in USTP and surrounding areas of Cagayan de Oro. Using state-of-the-art sensors
                and machine learning algorithms, we help communities stay informed and make better decisions about their
                health and safety.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our system continuously monitors various air pollutants including carbon monoxide, methane, propane, and
                other harmful gases, along with temperature and humidity levels. This data is processed in real-time to
                provide accurate air quality assessments and predictions.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  To empower communities with accurate, accessible air quality data that enables informed
                  decision-making and promotes environmental awareness.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Technology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  We use multiple MQ-series gas sensors (MQ135, MQ2, MQ3, MQ6, MQ9) combined with machine learning to
                  provide comprehensive air quality analysis.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Community Involvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Aerovant isn't just about sensors and data – it's about people. We encourage community members to report
                air quality issues they observe, creating a comprehensive picture of environmental conditions that
                combines technology with local knowledge.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Your reports help us validate sensor data, identify emerging issues, and respond more effectively to air
                quality concerns in the community.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle>Sensor Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Wind className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-semibold text-foreground mb-1">USTP Campus, Cagayan de Oro</p>
                  <p className="text-sm text-muted-foreground">Coordinates: 8.486071°N, 124.656805°E</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Our monitoring station is strategically located to provide coverage for the university campus and
                    surrounding residential areas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
