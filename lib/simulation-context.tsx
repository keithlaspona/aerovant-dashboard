"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { SensorReading } from "./types"
import {
  enableSimulation,
  disableSimulation,
  isSimulationEnabled,
  getSimulatedData,
  onSimulationUpdate,
  triggerSpikeEvent,
  generateSimulatedReading,
} from "./simulation-service"

interface SimulationContextType {
  isSimulating: boolean
  simulatedData: SensorReading | null
  toggleSimulation: () => void
  triggerSpike: () => void
}

const SimulationContext = createContext<SimulationContextType | null>(null)

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulatedData, setSimulatedData] = useState<SensorReading | null>(null)

  // Initialize simulation state on mount
  useEffect(() => {
    setIsSimulating(isSimulationEnabled())
    if (isSimulationEnabled()) {
      setSimulatedData(getSimulatedData())
    }
  }, [])

  // Subscribe to simulation updates
  useEffect(() => {
    if (!isSimulating) return

    const unsubscribe = onSimulationUpdate((data) => {
      setSimulatedData(data)
    })

    return unsubscribe
  }, [isSimulating])

  const handleToggleSimulation = useCallback(() => {
    if (isSimulating) {
      disableSimulation()
      setIsSimulating(false)
      setSimulatedData(null)
    } else {
      enableSimulation()
      setIsSimulating(true)
      setSimulatedData(getSimulatedData())
    }
  }, [isSimulating])

  const handleTriggerSpike = useCallback(() => {
    if (isSimulating) {
      const spikeData = triggerSpikeEvent()
      setSimulatedData(spikeData)
    }
  }, [isSimulating])

  return (
    <SimulationContext.Provider
      value={{
        isSimulating,
        simulatedData,
        toggleSimulation: handleToggleSimulation,
        triggerSpike: handleTriggerSpike,
      }}
    >
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return context
}
