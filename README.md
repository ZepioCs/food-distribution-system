# Food Distribution System

A modern web application for managing and tracking food distribution operations. Built with Next.js, TypeScript, and Supabase.

## Overview

This food distribution system is a comprehensive solution designed to streamline the process of food distribution management. It features RFID check-in capabilities, administrative controls, and multi-language support.

## Features

- 🔐 Secure Authentication System
- 👥 Admin Dashboard & Management
- 📱 Responsive Design
- 🌐 Multi-language Support (EN, DE, RU, IT, ES)
- 📊 Real-time Data Management
- 🏷️ RFID Integration
- 🔔 Real-time Notifications
- 🎨 Modern UI with Tailwind CSS
- 🌙 Dark/Light Mode Support

## Tech Stack

- **Frontend Framework:** Next.js 14
- **Language:** TypeScript
- **State Management:** MobX
- **UI Components:** Radix UI
- **Styling:** Tailwind CSS
- **Database:** Supabase
- **Authentication:** Supabase Auth
- **Internationalization:** next-intl
- **Forms:** React Hook Form
- **Data Validation:** Zod

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file with required Supabase credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

The following environment variables are required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Additional configuration variables as needed

## Project Structure

- `/app` - Next.js application routes
- `/components` - Reusable UI components
- `/services` - Backend services and API calls
- `/stores` - MobX state management stores
- `/messages` - Internationalization files
- `/models` - Data models and types
- `/providers` - React context providers
- `/public` - Static assets

## License

All rights reserved. This project is private and proprietary.

## Owner

This project belongs to zepiocs.

---

⚠️ **Note**: This is a private project. No contributions are accepted. 