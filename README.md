# ROMERO GADGETS — Admin Panel

Professional web-based admin dashboard for ROMERO GADGETS e-commerce.

## Tech Stack

- **React 18** + **Vite** — fast SPA
- **Tailwind CSS** — utility-first styling
- **Supabase** — backend, auth, database
- **React Router** — protected routes
- **Recharts** — analytics charts
- **Lucide React** — icons

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Install dependencies: `npm install`
4. Run dev server: `npm run dev`
5. Build for production: `npm run build`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Security

- Uses Supabase Auth for admin authentication
- RLS policies protect all data
- No service_role key in browser code
- Protected routes with permission checks
