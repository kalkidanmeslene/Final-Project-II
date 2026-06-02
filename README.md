# Hibir Events

A modern event management and ticketing platform built with Next.js 16, Prisma, Tailwind CSS, and internationalized routing.

## Authors

| Name | ID |
| --- | --- |
| Amar Kasim | UGR/7251/15 |
| Bersabeh Degafu | UGR/2049/15 |
| Eden Ephrem | UGR/6388/15 |
| Kalkidan Meslene | UGR/6083/15 |

## Features

- Event discovery and booking flow
- Organizer dashboard with event performance analytics
- Admin reports, moderation, and transfers
- Ticket QR generation and check-in support
- Email notifications for registration, ticket updates, and password resets
- Multilingual interface via `next-intl`
- PostgreSQL-backed data model with Prisma migrations

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Copy environment variables

```bash
cp .env.example .env
```

Update `.env` with your database connection and mail provider settings.

### 3. Run Prisma migrations

```bash
npm run db:migrate
```

### 4. Seed the database

```bash
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Useful scripts

- `npm run dev` - start development server
- `npm run build` - build production app
- `npm run start` - start production server
- `npm run lint` - run ESLint
- `npm run db:migrate` - apply Prisma migrations
- `npm run db:seed` - seed the database
- `npm run db:studio` - open Prisma Studio
- `npm run cron:notifications` - process scheduled email notifications

## Environment variables

Required variables are defined in `src/lib/env.ts` and supported by `.env.example`.

Minimum required values:

- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `AUTH_JWT_ISSUER`
- `AUTH_JWT_AUDIENCE`
- `APP_BASE_URL`
- `EMAIL_ENABLED`
- `EMAIL_PROVIDER`
- `EMAIL_FROM`

Optional email SMTP variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `RESEND_API_KEY`

Other recommended settings:

- `CRON_SECRET`
- `AUTH_ACCESS_TOKEN_TTL_SECONDS`
- `AUTH_REFRESH_TOKEN_TTL_SECONDS`

## Deployment

This app is ready to deploy on Vercel or any Node-compatible host.

For Vercel, use the `build` command and set environment variables in the deployment dashboard.

For a custom server:

```bash
npm run build
npm run start
```

## Notes

- The project uses Prisma for database access and schema management.
- The app includes support for organizer/admin roles, event management, and ticketing workflows.
- Internationalized routes are available under `src/app/[locale]`.
