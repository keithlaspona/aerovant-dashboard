# Aerovant Air Quality Monitoring System

A comprehensive real-time air quality monitoring application built with Next.js, Firebase, and TypeScript.

## Features

### Citizen-Facing Features
- **Real-time Air Quality Dashboard**: View current air quality readings from multiple gas sensors
- **Interactive Monitoring**: Auto-refreshing data every 30 seconds
- **Community Reports**: Submit and view air quality concerns in your area
- **Location-based Reporting**: Use GPS to pinpoint report locations
- **Visual Map**: See sensor location and nearby reports on an interactive map

### Stakeholder Features
- **Comprehensive Dashboard**: Overview of all system metrics and reports
- **Report Management**: Review, update status, and manage citizen reports
- **Analytics**: Historical data visualization with interactive charts
- **Filtering**: Filter reports by status and type
- **Real-time Updates**: Monitor air quality trends over time

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Firebase Realtime Database
- **Styling**: Tailwind CSS v4 with custom Aerovant theme
- **Charts**: Recharts for data visualization
- **UI Components**: shadcn/ui component library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase Realtime Database set up
- Environment variables configured

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a `.env.local` file with your Firebase configuration:
   \`\`\`
   NEXT_PUBLIC_FIREBASE_URL=your-firebase-database-url
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Structure

The application uses Firebase Realtime Database with the following structure:

### Sensor Readings (`/aerovant_readings`)
\`\`\`json
{
  "reading_id": {
    "timestamp": "2025-01-12T10:30:00Z",
    "readings": {
      "MQ135_ppm": 45.2,
      "MQ2_ppm": 12.5,
      "MQ4_ppm": 8.3,
      "MQ5_ppm": 15.7,
      "MQ9_ppm": 22.1
    },
    "environment": {
      "temperature": 28.5,
      "humidity": 65.2
    },
    "ml_prediction": {
      "classification": "Moderate",
      "confidence": 0.85
    }
  }
}
\`\`\`

### Citizen Reports (`/citizen_reports`)
\`\`\`json
{
  "report_id": {
    "location": "Near USTP Main Gate",
    "latitude": 8.486071,
    "longitude": 124.656805,
    "report_type": "smoke",
    "notes": "Heavy smoke observed",
    "timestamp": "2025-01-12T10:30:00Z",
    "status": "pending",
    "reporter_name": "John Doe",
    "reporter_contact": "john@example.com"
  }
}
\`\`\`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in Vercel project settings
4. Deploy!

The application is optimized for Vercel deployment with:
- Server-side rendering for real-time data
- API routes for data fetching
- Automatic static optimization where possible

## Color Branding

The application uses a custom blue/teal color palette:
- Navy: #001D39
- Deep Blue: #0A4174
- Medium Blue: #49769F
- Teal: #4E8EA2
- Light Teal: #6EA2B3
- Sky Blue: #7BBDE8
- Pale Blue: #BDD8E9

## Sensor Information

**Location**: USTP Campus, Cagayan de Oro, Philippines  
**Coordinates**: 8.486071°N, 124.656805°E

**Sensors**:
- MQ135: Air quality (CO2, NH3, NOx, smoke)
- MQ2: Combustible gases and smoke
- MQ4: Methane and natural gas
- MQ5: LPG, natural gas, coal gas
- MQ9: Carbon monoxide and flammable gases
- DHT22: Temperature and humidity

## Contributing

This is a monitoring system for USTP and the surrounding community. For questions or contributions, please contact the development team.

## License

Copyright © 2025 Aerovant Project. All rights reserved.
\`\`\`



<AssistantMessageContentPart partEncoded="eyJ0eXBlIjoidGFzay13YWl0aW5nLXYxIiwiY3JlYXRlZEF0IjoxNzYwMjc3ODEyNjMyLCJmaW5pc2hlZEF0IjoxNzYwMjc3ODEyNjMyLCJpZCI6IkZxd01IelNnM0tFNlBnZkEiLCJsYXN0UGFydFNlbnRBdCI6MTc2MDI3NzgxMjYzMiwicGFydHMiOlt7InR5cGUiOiJ0b29sLWNhbGxzIn1dfQ==" />



<AssistantMessageContentPart partEncoded="eyJ0eXBlIjoidGFzay1tYW5hZ2UtdG9kb3MtdjEiLCJpZCI6Ikkxa29lNTF4RncxUkNxQkciLCJ0YXNrTmFtZUFjdGl2ZSI6IkNvbXBsZXRpbmcgcHJvamVjdCIsInRvb2xDYWxsSWQiOiJ0b29sdV8wMURGQldmNm9mcVRyakRaMlBmUGJISHAiLCJ0YXNrTmFtZUNvbXBsZXRlIjoiQ29tcGxldGVkIHByb2plY3QiLCJjcmVhdGVkQXQiOjE3NjAyNzc4MTMzMjIsImZpbmlzaGVkQXQiOm51bGwsInBhcnRzIjpbXSwibGFzdFBhcnRTZW50QXQiOm51bGx9" />
