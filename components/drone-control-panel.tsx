"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function DroneControlPanel() {
  const [isSensing, setIsSensing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play()
    }
  }, [isSensing])

  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden">
      <div
        className="flex-[9] rounded-t-2xl flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: "#626e80" }}
      >
        <video
          key={isSensing ? "sensing" : "rest"}
          ref={videoRef}
          src={isSensing ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/drone_fly-Gqj1A6Qr26UMFSgHcwmJkuLekpRg0J.mp4" : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/drone_at_rest-F1RFDR3MU7AtZ8qZZxy9URhPOjEleE.mp4"}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          autoPlay
        />
      </div>

      <div className="flex-[1] flex items-center justify-center p-2">
        <Button
          onClick={() => setIsSensing(!isSensing)}
          className="w-full h-full text-base font-semibold"
          style={{ backgroundColor: "#004369" }}
        >
          {isSensing ? "End Sensing" : "Start Sensing"}
        </Button>
      </div>
    </div>
  )
}
