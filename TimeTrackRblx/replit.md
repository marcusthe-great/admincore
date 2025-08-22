# Overview

This is a full-stack staff time tracking application built for Roblox groups. The system allows administrators to monitor staff member activity, track work hours, and manage quota requirements. The application features a React frontend with a dashboard for viewing staff statistics, time tracking data, and leaderboards, while the backend provides REST APIs for staff management and integrates with Roblox's group API for automatic staff synchronization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API structure with dedicated route handlers
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Development**: Hot reload support with Vite integration in development mode

## Data Storage Solutions
- **Database**: PostgreSQL using Drizzle ORM as the database toolkit
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL connector
- **Fallback Storage**: In-memory storage implementation for development/testing

## Database Schema Design
- **Staff Members**: User ID, username, rank information, and join dates
- **Time Entries**: Session tracking with start/end times and duration calculations
- **Quota Settings**: Configurable weekly hour requirements and week start preferences
- **Quota Status**: Weekly tracking of staff quota completion and hours worked

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store
- **Security**: No explicit authentication system implemented (assumes trusted internal use)

## API Structure
- **Staff Management**: CRUD operations for staff members with Roblox group integration
- **Time Tracking**: Endpoints for recording and retrieving time entries
- **Dashboard Data**: Aggregated statistics, leaderboards, and activity reports
- **Quota Management**: Quota configuration and completion tracking

## State Management Patterns
- **Client State**: React Query for caching and synchronizing server state
- **Form State**: React Hook Form for complex form handling and validation
- **UI State**: React hooks and context for component-level state management

## Development Workflow
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Type Safety**: Shared TypeScript schemas between frontend and backend
- **Development Server**: Concurrent frontend and backend development with proxy setup

# External Dependencies

## Third-Party Services
- **Roblox Groups API**: Integration for fetching group member data and ranks
  - Endpoint: `https://groups.roblox.com/v1/groups/{groupId}/users`
  - Used for automatic staff synchronization based on group membership

- **Roblox Users API**: User profile information retrieval
  - Endpoint: `https://users.roblox.com/v1/users/{userId}`
  - Used for fetching detailed user information

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: Built-in connection management through Neon's serverless driver

## UI and Styling Libraries
- **Radix UI**: Unstyled, accessible UI component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: For component variant management

## Development and Build Tools
- **Vite**: Frontend build tool and development server
- **esbuild**: Fast JavaScript bundler for backend compilation
- **PostCSS**: CSS processing with Tailwind CSS integration
- **TypeScript**: Static type checking across the entire application

## Data Visualization
- **Recharts**: Chart library for displaying activity trends and statistics
- **Date-fns**: Date manipulation and formatting utilities

## Form and Validation
- **Zod**: Schema validation library
- **React Hook Form**: Form state management and validation