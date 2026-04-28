"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Info, LayoutDashboard, BarChart3, Home, Radio, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

interface NavigationProps {
  role?: "citizen" | "stakeholder"
}

export function Navigation({ role = "citizen" }: NavigationProps) {
  const pathname = usePathname()
  const [isSimulating, setIsSimulating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check simulation status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/sensor-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" }),
        })
        const data = await res.json()
        setIsSimulating(data.simulation === true)
      } catch {
        // Ignore errors on status check
      }
    }
    checkStatus()
  }, [])

  const toggleSimulation = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/sensor-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      })
      const data = await res.json()
      setIsSimulating(data.simulation === true)
    } catch (error) {
      console.error("[v0] Failed to toggle simulation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const triggerSpike = async () => {
    if (!isSimulating) return
    try {
      await fetch("/api/sensor-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "spike" }),
      })
    } catch (error) {
      console.error("[v0] Failed to trigger spike:", error)
    }
  }

  const citizenLinks = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/report", label: "Report Issue", icon: FileText },
    { href: "/about", label: "About", icon: Info },
  ]

  const stakeholderLinks = [
    { href: "/stakeholder", label: "Overview", icon: LayoutDashboard },
    { href: "/stakeholder/reports", label: "Manage Reports", icon: FileText },
    { href: "/stakeholder/analytics", label: "Analytics", icon: BarChart3 },
  ]

  const links = role === "stakeholder" ? stakeholderLinks : citizenLinks

  return (
    <nav className="border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 leading-7 my-[0]">
          <Link href={role === "stakeholder" ? "/stakeholder" : "/"} className="flex items-center gap-3 group">
            <span className="font-black text-[rgba(52,63,86,1)] text-4xl">ÆROVANT</span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"}
                >
                  <Link href={link.href} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                </Button>
              )
            })}

            {role === "citizen" && (
              <>
                {isSimulating && (
                  <Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs animate-pulse">
                    Demo Mode
                  </Badge>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="ml-2 border-primary/30 hover:bg-primary/10 bg-transparent"
                >
                  <Link href="/stakeholder">Stakeholder Login</Link>
                </Button>
              </>
            )}

            {role === "stakeholder" && (
              <>
                <div className="ml-2 flex items-center gap-1">
                  <Button
                    variant={isSimulating ? "default" : "outline"}
                    size="sm"
                    onClick={toggleSimulation}
                    disabled={isLoading}
                    className={
                      isSimulating
                        ? "bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                        : "border-amber-500/50 hover:bg-amber-500/10 bg-transparent gap-1.5"
                    }
                  >
                    <Radio className={`w-3.5 h-3.5 ${isSimulating ? "animate-pulse" : ""}`} />
                    {isLoading ? "..." : isSimulating ? "Simulating" : "Simulate"}
                  </Button>
                  {isSimulating && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerSpike}
                      className="border-red-500/50 hover:bg-red-500/10 bg-transparent text-red-600 gap-1"
                      title="Trigger a spike event to simulate hazardous conditions"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Spike
                    </Button>
                  )}
                </div>
                {isSimulating && (
                  <Badge variant="outline" className="ml-1 bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                    Demo Mode
                  </Badge>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="ml-2 border-primary/30 hover:bg-primary/10 bg-transparent"
                >
                  <Link href="/">Citizen View</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
