"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Info, LayoutDashboard, BarChart3, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationProps {
  role?: "citizen" | "stakeholder"
}

export function Navigation({ role = "citizen" }: NavigationProps) {
  const pathname = usePathname()

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
              <Button
                asChild
                variant="outline"
                size="sm"
                className="ml-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                <Link href="/stakeholder">Stakeholder Login</Link>
              </Button>
            )}

            {role === "stakeholder" && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="ml-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                <Link href="/">Citizen View</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
