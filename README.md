# Aerovant Air Quality Monitoring System

A comprehensive real-time air quality monitoring application built with Next.js, Firebase, and TypeScript.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Structure](#database-structure)
- [API Routes](#api-routes)
- [Configuration](#configuration)
- [Sensor Information](#sensor-information)
- [Contributing](#contributing)
- [License](#license)

## Overview

Aerovant is a real-time air quality monitoring system designed for USTP Campus and the surrounding community in Cagayan de Oro, Philippines. The system integrates multiple gas sensors (MQ series) to provide comprehensive air quality data, citizen reporting capabilities, and stakeholder analytics.

Key capabilities include real-time monitoring with auto-refresh every 30 seconds, location-based reporting using GPS coordinates, interactive analytics with historical data visualization, visual mapping of sensor locations and community reports, and ML-powered predictions for air quality classification.

## Features

### Citizen-Facing Features

- Real-time Air Quality Dashboard: View current air quality readings from multiple gas sensors
- Interactive Monitoring: Auto-refreshing data every 30 seconds
- Community Reports: Submit and view air quality concerns in your area
- Location-based Reporting: Use GPS to pinpoint report locations
- Visual Map: See sensor location and nearby reports on an interactive map

### Stakeholder Features

- Comprehensive Dashboard: Overview of all system metrics and reports
- Report Management: Review, update status, and manage citizen reports
- Analytics: Historical data visualization with interactive charts
- Filtering: Filter reports by status and type
- Real-time Updates: Monitor air quality trends over time

## Technology Stack

- Framework: Next.js 15 with App Router
- Language: TypeScript
- Database: Firebase Realtime Database
- Styling: Tailwind CSS v4 with custom Aerovant theme
- Charts: Recharts for data visualization
- UI Components: shadcn/ui component library
- Package Manager: npm or pnpm

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18 or higher
- npm or pnpm package manager
- Firebase project with Realtime Database enabled
- Git for version control

### Installation

1. Clone the repository:
```bash
git clone https://github.com/keithlaspona/aerovant-dashboard.git
cd aerovant-dashboard
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Create environment configuration:

Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_FIREBASE_URL=your-firebase-database-url
```

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open your browser:

Navigate to http://localhost:3000 to view the application.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
aerovant-dashboard/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Citizen dashboard
│   ├── stakeholders/        # Stakeholder pages
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── ...                  # Custom components
├── lib/                     # Utility functions
│   ├── firebase.ts          # Firebase configuration
│   └── utils.ts             # Helper functions
├── public/                  # Static assets
├── scripts/                 # Utility scripts
├── styles/                  # Global styles
└── ...                      # Configuration files
```

## Database Structure

The application uses Firebase Realtime Database with the following structure:

### Sensor Readings Path: `/aerovant_readings`

```json
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
```

### Citizen Reports Path: `/citizen_reports`

```json
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
```

### Data Field Descriptions

#### Sensor Readings
- `timestamp`: ISO 8601 formatted datetime
- `MQ135_ppm`: Air quality sensor (CO2, NH3, NOx, smoke) in parts per million
- `MQ2_ppm`: Combustible gases and smoke sensor in ppm
- `MQ4_ppm`: Methane and natural gas sensor in ppm
- `MQ5_ppm`: LPG, natural gas, coal gas sensor in ppm
- `MQ9_ppm`: Carbon monoxide and flammable gases sensor in ppm
- `temperature`: Ambient temperature in Celsius
- `humidity`: Relative humidity percentage
- `classification`: ML model prediction (0 = Critical, 1 = Stable)
- `confidence`: ML model confidence score (0-1)

#### Citizen Reports
- `location`: Descriptive location text
- `latitude`: GPS latitude coordinate
- `longitude`: GPS longitude coordinate
- `report_type`: Type of issue (smoke, odor, dust, etc.)
- `notes`: Additional details from reporter
- `timestamp`: ISO 8601 formatted datetime
- `status`: Report status (pending, investigating, resolved, dismissed)
- `reporter_name`: Name of person submitting report
- `reporter_contact`: Email or contact information

## API Routes

The application provides the following API endpoints:

### GET /api/readings
Fetch the latest sensor readings from Firebase.

### GET /api/reports
Fetch all citizen reports.

### POST /api/reports
Submit a new citizen report.

### PATCH /api/reports/[id]
Update an existing report status.

## Configuration

### Environment Variables

The application requires the following environment variable:

```
NEXT_PUBLIC_FIREBASE_URL=your-firebase-database-url
```

Add this to your `.env.local` file in the root directory.

## Sensor Information

### Location Details
- Location: USTP Campus, Cagayan de Oro, Philippines
- Coordinates: 8.486071°N, 124.656805°E

### Sensor Array

The system utilizes the following sensors:

- MQ135: Air quality sensor detecting CO2, NH3, NOx, and smoke
- MQ2: Combustible gases and smoke detection
- MQ4: Methane and natural gas detection
- MQ5: LPG, natural gas, and coal gas detection
- MQ9: Carbon monoxide and flammable gases detection
- DHT22: Temperature and humidity monitoring

### Sensor Calibration

Sensors are calibrated based on manufacturer specifications and local environmental conditions. Regular maintenance and calibration checks are recommended every 6 months.

## Contributing

This is a monitoring system for USTP and the surrounding community. We welcome contributions from developers, researchers, and community members.

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

### Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Test your changes thoroughly
- Update documentation as needed
- Ensure all tests pass before submitting

### Reporting Issues

If you encounter bugs or have feature requests:
- Check existing issues first
- Provide detailed description
- Include steps to reproduce (for bugs)
- Add screenshots if applicable

### Contact

For questions or collaboration inquiries, please contact the development team through the repository issues page or via email.

## License

Copyright © 2025 Aerovant Project. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or modification of this software, via any medium, is strictly prohibited without express written permission from the Aerovant Project team.

## Acknowledgments

- USTP for providing the location and support for sensor deployment
- Firebase for real-time database infrastructure
- Next.js team for the excellent framework
- The open-source community for various tools and libraries used in this project

## Support

For technical support or questions:
- Create an issue in the GitHub repository
- Contact the development team

## Changelog

See CHANGELOG.md for a list of changes and version history.
