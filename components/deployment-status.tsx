"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Rocket, CheckCircle2, Circle, Clock } from "lucide-react"

interface DeploymentPhase {
  id: string
  name: string
  description: string
  status: "completed" | "in-progress" | "pending"
  progress: number
}

export function DeploymentStatus() {
  const [phases, setPhases] = useState<DeploymentPhase[]>([
    {
      id: "planning",
      name: "Planning & Site Survey",
      description: "Location assessment and equipment planning",
      status: "completed",
      progress: 100,
    },
    {
      id: "procurement",
      name: "Equipment Procurement",
      description: "Acquiring sensors and monitoring devices",
      status: "completed",
      progress: 100,
    },
    {
      id: "installation",
      name: "Hardware Installation",
      description: "Installing sensors at designated locations",
      status: "in-progress",
      progress: 65,
    },
    {
      id: "calibration",
      name: "Sensor Calibration",
      description: "Calibrating sensors for accurate readings",
      status: "pending",
      progress: 0,
    },
    {
      id: "testing",
      name: "System Testing",
      description: "Testing data collection and transmission",
      status: "pending",
      progress: 0,
    },
    {
      id: "deployment",
      name: "Full Deployment",
      description: "System goes live for public monitoring",
      status: "pending",
      progress: 0,
    },
  ])

  const overallProgress = Math.round(phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length)

  const getStatusIcon = (status: DeploymentPhase["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
      case "pending":
        return <Circle className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: DeploymentPhase["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-500">In Progress</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-6 h-6 text-primary" />
              Aerovant Deployment Status
            </CardTitle>
            <CardDescription>Track the progress of system deployment</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
            <div className="text-sm text-muted-foreground">Overall Progress</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Completion</span>
              <span className="text-muted-foreground">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div
                key={phase.id}
                className="p-4 rounded-lg border-2 border-primary/10 bg-gradient-to-r from-background to-primary/5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(phase.status)}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {index + 1}. {phase.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                      </div>
                      {getStatusBadge(phase.status)}
                    </div>
                    {phase.status !== "pending" && (
                      <div className="space-y-1">
                        <Progress value={phase.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">{phase.progress}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
