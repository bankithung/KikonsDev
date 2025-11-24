# Consultancy Dev - Frontend

A multi-tenant consultancy management application frontend built with Next.js, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **Icons**: Lucide React
- **State Management**: Zustand (Auth), TanStack Query (Server State)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Mocking**: Custom `apiClient` with mock delays

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Run Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

- `/app` - Next.js App Router pages and layouts.
- `/components` - Reusable UI components and layout blocks.
- `/lib` - Utilities, types, and the `apiClient`.
- `/store` - Global client state (Zustand).
- `/providers` - React Context providers.

## API & Mocking

The application uses a `lib/apiClient.ts` abstraction. Currently, it returns mock data with simulated latency.

To connect to a real backend:
1. Update `lib/apiClient.ts` to fetch from your API endpoints using `fetch` or `axios`.
2. Ensure the backend returns data matching the interfaces in `lib/types.ts`.

## Authentication

- **Dev Mode**: The login page (`/login`) provides quick buttons to login as different roles (DEV_ADMIN, COMPANY_ADMIN, EMPLOYEE).
- **Auth State**: Managed via `useAuthStore` (Zustand), persisted to local storage.

## Roles

- `DEV_ADMIN`: Access to all features + Developer Tools.
- `COMPANY_ADMIN`: Access to business features + Settings/User Management.
- `EMPLOYEE`: Access to day-to-day operations (Enquiries, Registrations, etc.).
