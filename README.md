# Smart Waste Management – AI-Powered Web App

A full-stack web app for reporting garbage issues with GPS, photos, and optional AI-powered waste classification. Built with Next.js 14, MongoDB, JWT auth, and Leaflet maps.

## Features

- **User:** Signup / Login, report issues with photo + GPS, select waste type, view reports on map, track complaint status
- **Admin:** View all complaints, update status (Pending → In Progress → Completed), delete spam
- **Map:** All reports on Leaflet map with marker clustering, click for details
- **AI (optional):** Waste category detection and recycling tips via OpenAI; fallback logic when no API key

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Next.js API routes, Node.js
- **Database:** MongoDB Atlas, Mongoose
- **Auth:** JWT (httpOnly cookie), bcrypt
- **Maps:** Leaflet.js

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

## Installation

1. **Clone and install**

   ```bash
   cd smart-waste-app
   npm install
   ```

2. **Environment variables**

   Copy the example env and set your values:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   - `MONGODB_URI` – MongoDB connection string (required)
   - `JWT_SECRET` – Secret for JWT (required in production)
   - `OPENAI_API_KEY` – Optional; if missing, app uses built-in fallback

3. **MongoDB setup**

   - Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Get the connection string and put it in `MONGODB_URI`
   - Ensure your IP is allowed in Network Access (or use 0.0.0.0/0 for dev)

4. **Seed sample data (optional)**

   ```bash
   npm run seed
   ```

   Creates:

   - Admin: `admin@smartwaste.local` / `admin123`
   - User: `user@smartwaste.local` / `user123`
   - A few sample complaints for the map

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Home** – Landing and quick links  
- **Map** – All reports on map (no login required to view)  
- **Report** – Submit a report (login required)  
- **Login / Register** – Auth  
- **Admin** – Manage complaints (admin role only)

## Build & production

```bash
npm run build
npm start
```

## Deployment (Vercel)

1. Push the repo to GitHub and import the project in Vercel.
2. In Vercel project **Settings → Environment Variables**, add:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `OPENAI_API_KEY` (optional)
3. Deploy. API routes and auth will use these variables.

## Project structure

```
/app          – App Router pages (home, login, register, report, map, admin)
/components   – AuthContext, Nav, MapView
/lib          – db, auth, ai, validators
/models       – User, Complaint (Mongoose)
/app/api      – auth (login, register, me, logout), complaints, complaints/map
/public       – static assets; uploads go to public/uploads
```

## Error handling

- API routes return appropriate status codes and `{ error: "message" }` on failure.
- Frontend uses toasts (react-hot-toast) for user feedback.
- Missing `MONGODB_URI` or invalid JWT is handled with clear errors.

## License

MIT.
