import type { SensorReading } from "./types"

// Sensor location (same as firebase-service to avoid circular dependency)
const SIMULATION_SENSOR_LOCATION = {
  latitude: 8.486071,
  longitude: 124.656805,
  name: "USTP Campus",
}

// Simulation state
let simulationEnabled = false
let lastSimulatedData: SensorReading | null = null
let simulationInterval: NodeJS.Timeout | null = null
let dataUpdateCallbacks: Set<(data: SensorReading) => void> = new Set()

// Thresholds for critical status detection
const CRITICAL_THRESHOLDS = {
  MQ2: 800,
  MQ3: 900,
  MQ6: 1000,
  MQ9: 600,
  MQ135: 700,
}

// Sensor ranges for realistic simulation
const SENSOR_RANGES = {
  MQ2: { min: 200, max: 1000, safeMax: 600 },
  MQ3: { min: 250, max: 1100, safeMax: 700 },
  MQ6: { min: 300, max: 1200, safeMax: 800 },
  MQ9: { min: 100, max: 800, safeMax: 500 },
  MQ135: { min: 150, max: 900, safeMax: 550 },
  temperature: { min: 24, max: 34 },
  humidity: { min: 40, max: 80 },
}

// Smoothing factor for realistic transitions (0-1, higher = more smoothing)
const SMOOTHING_FACTOR = 0.7

// 20% chance of a critical reading, 80% stable
const CRITICAL_PROBABILITY = 0.2

// Current trend direction for each sensor (-1, 0, 1)
let trends: Record<string, number> = {
  MQ2: 0,
  MQ3: 0,
  MQ6: 0,
  MQ9: 0,
  MQ135: 0,
  temperature: 0,
  humidity: 0,
}

// Counter for trend changes
let trendCounter = 0

// Track whether the last reading was critical to prevent back-to-back criticals
let lastReadingWasCritical = false

/**
 * Generate a smooth value transition staying within the safe zone (below threshold).
 */
function generateSafeValue(
  currentValue: number,
  min: number,
  safeMax: number,
  key: string
): number {
  // Update trend periodically
  if (trendCounter % 5 === 0) {
    const trendChange = Math.random()
    if (trendChange < 0.3) {
      trends[key] = -1 // Decreasing
    } else if (trendChange < 0.6) {
      trends[key] = 1 // Increasing
    } else {
      trends[key] = 0 // Stable
    }
  }

  const range = safeMax - min
  const baseChange = (Math.random() - 0.5) * range * 0.1
  const trendInfluence = trends[key] * range * 0.02
  const totalChange = baseChange + trendInfluence

  const newValue = currentValue * SMOOTHING_FACTOR + (currentValue + totalChange) * (1 - SMOOTHING_FACTOR)

  // Clamp strictly within safe zone
  return Math.round(Math.max(min, Math.min(safeMax * 0.95, newValue)) * 100) / 100
}

/**
 * Generate a critical spike value that exceeds the threshold for exactly one reading.
 * The value is pushed into the critical zone (threshold to max) for a single event.
 */
function generateCriticalValue(threshold: number, max: number): number {
  // Spike between threshold+5% and max*0.95 for a realistic but clearly critical value
  const spikeMin = threshold * 1.05
  const spikeMax = max * 0.95
  return Math.round((spikeMin + Math.random() * (spikeMax - spikeMin)) * 100) / 100
}

/**
 * Generate a smooth value transition for environment sensors (no spikes).
 */
function generateEnvValue(
  currentValue: number,
  min: number,
  max: number,
  key: string
): number {
  if (trendCounter % 5 === 0) {
    const trendChange = Math.random()
    if (trendChange < 0.3) {
      trends[key] = -1
    } else if (trendChange < 0.6) {
      trends[key] = 1
    } else {
      trends[key] = 0
    }
  }

  const range = max - min
  const baseChange = (Math.random() - 0.5) * range * 0.05
  const trendInfluence = trends[key] * range * 0.01
  const totalChange = baseChange + trendInfluence

  const newValue = currentValue * SMOOTHING_FACTOR + (currentValue + totalChange) * (1 - SMOOTHING_FACTOR)
  return Math.round(Math.max(min, Math.min(max, newValue)) * 100) / 100
}

/**
 * Determine if any sensor value exceeds critical threshold
 */
function calculateStatus(readings: SensorReading["readings"]): { classification: string | number; confidence: number } {
  const isCritical =
    readings.MQ2_ppm > CRITICAL_THRESHOLDS.MQ2 ||
    readings.MQ3_ppm > CRITICAL_THRESHOLDS.MQ3 ||
    readings.MQ6_ppm > CRITICAL_THRESHOLDS.MQ6 ||
    readings.MQ9_ppm > CRITICAL_THRESHOLDS.MQ9 ||
    readings.MQ135_ppm > CRITICAL_THRESHOLDS.MQ135

  // Calculate confidence based on how far from thresholds
  let maxRatio = 0
  maxRatio = Math.max(maxRatio, readings.MQ2_ppm / CRITICAL_THRESHOLDS.MQ2)
  maxRatio = Math.max(maxRatio, readings.MQ3_ppm / CRITICAL_THRESHOLDS.MQ3)
  maxRatio = Math.max(maxRatio, readings.MQ6_ppm / CRITICAL_THRESHOLDS.MQ6)
  maxRatio = Math.max(maxRatio, readings.MQ9_ppm / CRITICAL_THRESHOLDS.MQ9)
  maxRatio = Math.max(maxRatio, readings.MQ135_ppm / CRITICAL_THRESHOLDS.MQ135)

  const confidence = isCritical
    ? Math.min(0.95, 0.7 + maxRatio * 0.2)
    : Math.min(0.95, 0.7 + (1 - maxRatio) * 0.2)

  return {
    classification: isCritical ? 0 : 1, // 0 = Critical, 1 = Stable (matching Firebase format)
    confidence: Math.round(confidence * 100) / 100,
  }
}

/**
 * Calculate ENV index based on sensor readings and environment
 */
function calculateEnvIndex(readings: SensorReading["readings"], temp: number, humidity: number): number {
  // Weighted average of normalized sensor values
  const mq2Norm = readings.MQ2_ppm / SENSOR_RANGES.MQ2.max
  const mq3Norm = readings.MQ3_ppm / SENSOR_RANGES.MQ3.max
  const mq6Norm = readings.MQ6_ppm / SENSOR_RANGES.MQ6.max
  const mq9Norm = readings.MQ9_ppm / SENSOR_RANGES.MQ9.max
  const mq135Norm = readings.MQ135_ppm / SENSOR_RANGES.MQ135.max

  // Temperature factor (optimal around 25-28)
  const tempFactor = 1 - Math.abs(temp - 26.5) / 20

  // Humidity factor (optimal around 50-60%)
  const humidityFactor = 1 - Math.abs(humidity - 55) / 50

  // Calculate composite index (lower is better for gases)
  const gasIndex = (mq2Norm + mq3Norm + mq6Norm + mq9Norm + mq135Norm) / 5
  const envIndex = (1 - gasIndex * 0.6) * tempFactor * humidityFactor * 10

  return Math.round(Math.max(0, Math.min(10, envIndex)) * 100) / 100
}

/**
 * Generate a single simulated sensor reading.
 *
 * Distribution rules:
 *  - 80% of readings → all sensors stay within safe range (Stable)
 *  - 20% of readings → exactly one random sensor spikes into critical zone (Critical)
 *  - A critical reading is NEVER allowed to follow another critical reading
 *    (lastReadingWasCritical guard), ensuring criticals are always isolated events.
 */
export function generateSimulatedReading(): SensorReading {
  trendCounter++

  // Get previous values or initialize with mid-range safe values
  const prev = lastSimulatedData || {
    readings: {
      MQ2_ppm: (SENSOR_RANGES.MQ2.min + SENSOR_RANGES.MQ2.safeMax) / 2,
      MQ3_ppm: (SENSOR_RANGES.MQ3.min + SENSOR_RANGES.MQ3.safeMax) / 2,
      MQ6_ppm: (SENSOR_RANGES.MQ6.min + SENSOR_RANGES.MQ6.safeMax) / 2,
      MQ9_ppm: (SENSOR_RANGES.MQ9.min + SENSOR_RANGES.MQ9.safeMax) / 2,
      MQ135_ppm: (SENSOR_RANGES.MQ135.min + SENSOR_RANGES.MQ135.safeMax) / 2,
    },
    environment: {
      temperature: (SENSOR_RANGES.temperature.min + SENSOR_RANGES.temperature.max) / 2,
      humidity: (SENSOR_RANGES.humidity.min + SENSOR_RANGES.humidity.max) / 2,
    },
  }

  // Decide whether this reading will be critical.
  // Blocked if the last reading was already critical (no back-to-back criticals).
  const rollCritical = !lastReadingWasCritical && Math.random() < CRITICAL_PROBABILITY

  let readings: SensorReading["readings"]

  if (rollCritical) {
    // Pick exactly one sensor to exceed its threshold
    const spikeTargets = ["MQ2", "MQ3", "MQ6", "MQ9", "MQ135"] as const
    const spikeSensor = spikeTargets[Math.floor(Math.random() * spikeTargets.length)]

    readings = {
      MQ2_ppm:
        spikeSensor === "MQ2"
          ? generateCriticalValue(CRITICAL_THRESHOLDS.MQ2, SENSOR_RANGES.MQ2.max)
          : generateSafeValue(prev.readings.MQ2_ppm, SENSOR_RANGES.MQ2.min, SENSOR_RANGES.MQ2.safeMax, "MQ2"),
      MQ3_ppm:
        spikeSensor === "MQ3"
          ? generateCriticalValue(CRITICAL_THRESHOLDS.MQ3, SENSOR_RANGES.MQ3.max)
          : generateSafeValue(prev.readings.MQ3_ppm, SENSOR_RANGES.MQ3.min, SENSOR_RANGES.MQ3.safeMax, "MQ3"),
      MQ6_ppm:
        spikeSensor === "MQ6"
          ? generateCriticalValue(CRITICAL_THRESHOLDS.MQ6, SENSOR_RANGES.MQ6.max)
          : generateSafeValue(prev.readings.MQ6_ppm, SENSOR_RANGES.MQ6.min, SENSOR_RANGES.MQ6.safeMax, "MQ6"),
      MQ9_ppm:
        spikeSensor === "MQ9"
          ? generateCriticalValue(CRITICAL_THRESHOLDS.MQ9, SENSOR_RANGES.MQ9.max)
          : generateSafeValue(prev.readings.MQ9_ppm, SENSOR_RANGES.MQ9.min, SENSOR_RANGES.MQ9.safeMax, "MQ9"),
      MQ135_ppm:
        spikeSensor === "MQ135"
          ? generateCriticalValue(CRITICAL_THRESHOLDS.MQ135, SENSOR_RANGES.MQ135.max)
          : generateSafeValue(prev.readings.MQ135_ppm, SENSOR_RANGES.MQ135.min, SENSOR_RANGES.MQ135.safeMax, "MQ135"),
    }

    lastReadingWasCritical = true
  } else {
    // All sensors stay comfortably within safe range
    readings = {
      MQ2_ppm: generateSafeValue(prev.readings.MQ2_ppm, SENSOR_RANGES.MQ2.min, SENSOR_RANGES.MQ2.safeMax, "MQ2"),
      MQ3_ppm: generateSafeValue(prev.readings.MQ3_ppm, SENSOR_RANGES.MQ3.min, SENSOR_RANGES.MQ3.safeMax, "MQ3"),
      MQ6_ppm: generateSafeValue(prev.readings.MQ6_ppm, SENSOR_RANGES.MQ6.min, SENSOR_RANGES.MQ6.safeMax, "MQ6"),
      MQ9_ppm: generateSafeValue(prev.readings.MQ9_ppm, SENSOR_RANGES.MQ9.min, SENSOR_RANGES.MQ9.safeMax, "MQ9"),
      MQ135_ppm: generateSafeValue(prev.readings.MQ135_ppm, SENSOR_RANGES.MQ135.min, SENSOR_RANGES.MQ135.safeMax, "MQ135"),
    }

    lastReadingWasCritical = false
  }

  // Environment sensors change slowly and never spike
  const temperature = generateEnvValue(
    prev.environment.temperature,
    SENSOR_RANGES.temperature.min,
    SENSOR_RANGES.temperature.max,
    "temperature"
  )

  const humidity = generateEnvValue(
    prev.environment.humidity,
    SENSOR_RANGES.humidity.min,
    SENSOR_RANGES.humidity.max,
    "humidity"
  )

  const envIndex = calculateEnvIndex(readings, temperature, humidity)
  const mlPrediction = calculateStatus(readings)

  const simulatedData: SensorReading = {
    timestamp: new Date().toISOString(),
    readings,
    environment: {
      temperature,
      humidity,
      env_index: envIndex,
    },
    ml_prediction: mlPrediction,
    location: SIMULATION_SENSOR_LOCATION,
  }

  lastSimulatedData = simulatedData
  return simulatedData
}

/**
 * Check if simulation mode is enabled
 */
export function isSimulationEnabled(): boolean {
  return simulationEnabled
}

/**
 * Enable simulation mode
 */
export function enableSimulation(): void {
  if (simulationEnabled) return

  simulationEnabled = true
  console.log("[v0] Simulation mode ENABLED")

  // Generate initial data
  lastSimulatedData = generateSimulatedReading()

  // Start interval to update data every 4 seconds
  simulationInterval = setInterval(() => {
    const newData = generateSimulatedReading()
    // Notify all registered callbacks
    dataUpdateCallbacks.forEach((callback) => {
      try {
        callback(newData)
      } catch (error) {
        console.error("[v0] Error in simulation callback:", error)
      }
    })
  }, 4000)
}

/**
 * Disable simulation mode
 */
export function disableSimulation(): void {
  if (!simulationEnabled) return

  simulationEnabled = false
  console.log("[v0] Simulation mode DISABLED")

  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }

  lastSimulatedData = null
}

/**
 * Toggle simulation mode
 */
export function toggleSimulation(): boolean {
  if (simulationEnabled) {
    disableSimulation()
  } else {
    enableSimulation()
  }
  return simulationEnabled
}

/**
 * Get the current simulated data (or generate new if none exists)
 */
export function getSimulatedData(): SensorReading {
  if (!lastSimulatedData) {
    lastSimulatedData = generateSimulatedReading()
  }
  return lastSimulatedData
}

/**
 * Register a callback for simulation updates
 */
export function onSimulationUpdate(callback: (data: SensorReading) => void): () => void {
  dataUpdateCallbacks.add(callback)
  return () => {
    dataUpdateCallbacks.delete(callback)
  }
}

/**
 * Force a spike event for testing/demonstration
 */
export function triggerSpikeEvent(): SensorReading {
  if (!lastSimulatedData) {
    lastSimulatedData = generateSimulatedReading()
  }

  // Generate critical values
  const readings = {
    MQ2_ppm: SENSOR_RANGES.MQ2.max * 0.85 + Math.random() * SENSOR_RANGES.MQ2.max * 0.15,
    MQ3_ppm: lastSimulatedData.readings.MQ3_ppm,
    MQ6_ppm: lastSimulatedData.readings.MQ6_ppm,
    MQ9_ppm: SENSOR_RANGES.MQ9.max * 0.8 + Math.random() * SENSOR_RANGES.MQ9.max * 0.2,
    MQ135_ppm: SENSOR_RANGES.MQ135.max * 0.75 + Math.random() * SENSOR_RANGES.MQ135.max * 0.25,
  }

  const mlPrediction = calculateStatus(readings)

  const spikeData: SensorReading = {
    ...lastSimulatedData,
    timestamp: new Date().toISOString(),
    readings,
    ml_prediction: mlPrediction,
  }

  // Mark as critical so the next auto-generated reading is forced stable
  lastReadingWasCritical = true
  lastSimulatedData = spikeData

  // Notify callbacks
  dataUpdateCallbacks.forEach((callback) => {
    try {
      callback(spikeData)
    } catch (error) {
      console.error("[v0] Error in simulation callback:", error)
    }
  })

  return spikeData
}
