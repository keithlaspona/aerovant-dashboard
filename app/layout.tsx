import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Suspense } from "react"
import { ToastProvider } from "@/components/ui/toast"

export const metadata: Metadata = {
  title: "Aerovant - Air Quality Monitoring System",
  description: "Real-time air quality monitoring for USTP and surrounding areas",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ToastProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </ToastProvider>
      </body>
    </html>
  )
}
