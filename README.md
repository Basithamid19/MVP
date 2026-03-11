# VilniusPro Marketplace MVP

A production-ready two-sided services marketplace for local professionals in Vilnius, Lithuania.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Prisma ORM + PostgreSQL
- **Auth**: NextAuth.js (Credentials Provider)
- **Animations**: Motion (framer-motion)
- **Icons**: Lucide React

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
Ensure you have a PostgreSQL database running and update the `DATABASE_URL` in your `.env` file.

```bash
# Generate Prisma Client
npx prisma generate

# Run Migrations
npx prisma migrate dev --name init
```

### 3. Seed Data
Populate the database with initial categories, an admin, customers, and providers.
```bash
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```

## Business Rules & Roles
- **Customer**: Can browse pros, create service requests, review quotes, and book services.
- **Provider**: Can manage profile, respond to requests with quotes, and manage bookings.
- **Admin**: Can moderate reviews, verify providers, and view marketplace analytics.

## Key Features
- **Mobile-First Design**: Optimized for on-the-go service booking.
- **Verification Tiers**: Multi-level trust system (Tier 0 to Tier 3).
- **Real-time Chat**: Polling-based messaging between customers and pros.
- **Review System**: Only completed bookings can be reviewed to ensure authenticity.

## Environment Variables
Copy `.env.example` to `.env` and fill in the required values:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXTAUTH_SECRET`: A random string for session encryption.
- `NEXTAUTH_URL`: Your application URL (e.g., http://localhost:3000).
