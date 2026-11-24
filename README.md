# Borro

Borro is a campus-sharing platform for students. It combines a React marketplace with rental requests, lost-and-found reports, project collaboration, campus events, notifications, and an administrator dashboard.

## Current Features

- Student signup and login with JWT authentication
- Student and admin login modes
- Marketplace listings for rent, sale, exchange, and giveaway
- Search and category filtering
- Rental requests with start/end dates and completion tracking
- Lost-and-found reports with status updates
- Project listings and student applications
- Campus event creation and management
- In-app notifications
- Light and dark themes
- Admin dashboard for users, listings, reports, projects, events, and platform statistics

## Tech Stack

**Frontend**

- React 19
- TypeScript
- Vite 8
- React Router
- Tailwind CSS 4
- Framer Motion
- Lucide React

**Backend**

- Node.js
- Express 5
- PostgreSQL
- JSON Web Tokens
- bcryptjs

## Project Structure

```text
BORRO/
├── src/
│   ├── components/       # Shared UI components
│   ├── context/          # Authentication and theme state
│   ├── pages/            # Application routes and screens
│   └── services/         # Frontend API client
├── backend/
│   └── src/
│       ├── config/       # PostgreSQL configuration
│       ├── middleware/   # JWT authentication middleware
│       ├── routes/       # REST API route modules
│       └── server.js     # Express application entry point
├── public/               # Static public assets
├── borro_backup.dump     # PostgreSQL database backup
└── dist/                 # Generated frontend build
```

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL

## Setup

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Configure PostgreSQL

Create a PostgreSQL database and restore the included backup if needed:

```bash
createdb borro
pg_restore --clean --if-exists --dbname=borro borro_backup.dump
```

The dump is ignored by Git and may be intended for local development. You can also initialize the database with an equivalent schema and set the environment variables below.

### 4. Configure the backend

Create `backend/.env`:

```dotenv
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret

# Use DATABASE_URL or the individual DB_* variables.
DATABASE_URL=postgresql://user:password@localhost:5432/borro

# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=borro
# DB_USER=postgres
# DB_PASSWORD=your-password
```

Set `NODE_ENV=production` when deploying to enable SSL for `DATABASE_URL`. When using individual database variables, the application uses PostgreSQL over the configured host and port.

### 5. Configure the frontend

The frontend defaults to `http://localhost:5000/api`. To use a different backend URL, create a root `.env.local` file:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

## Run Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API health: `http://localhost:5000/api/health`
- Database health: `http://localhost:5000/api/db-test`

## Available Scripts

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build |

### Backend

| Command | Description |
| --- | --- |
| `npm start` | Start the backend server |
| `npm run dev` | Start the backend with nodemon |

Run backend scripts from the `backend` directory.

## API Overview

| Area | Base path |
| --- | --- |
| Authentication | `/api/auth` |
| Marketplace listings | `/api/listings` |
| Rentals | `/api/rentals` |
| Lost and found | `/api/lost-found` |
| Projects and applications | `/api/projects` |
| Campus events | `/api/events` |
| Notifications | `/api/notifications` |
| Admin dashboard | `/api/admin` |

Protected routes require an `Authorization: Bearer <token>` header. Admin routes are restricted to users with the `admin` role.

