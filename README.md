# Qonneq Portal

A modern React-based dashboard portal for connecting to Odoo and displaying machine telemetry, customer data, and analytics.

## Project Structure

- **qonneq_portal** - React frontend (this repository)
- **api** - Local API development server (Express proxy)
- **odoo_module** - Odoo module for backend API

## Features

- 🔐 Secure authentication with Odoo backend
- 📊 Real-time dashboard with statistics
- 🏭 Customer and machine management
- 📈 Telemetry data visualization
- 🌐 CORS-aware proxy for seamless Odoo integration

## Technologies

- **Vite** - Fast build tool and dev server
- **React** - UI framework
- **TypeScript** - Type safety
- **shadcn-ui** - Beautiful component library
- **Tailwind CSS** - Utility-first styling
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Access to an Odoo instance with the qonneq module installed

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd qonneq_portal

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Update .env with your Odoo instance URL
# Edit VITE_API_BASE_URL to point to your Odoo server
```

### Configuration

Edit `.env` file:

```env
# Odoo API Base URL
VITE_API_BASE_URL=http://localhost:8069

# Auth Mode (odoo or standalone)
VITE_AUTH_MODE=standalone
```

### Development

In separate terminals, run:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Local API Server (Proxy)
npm run dev:api
```

The application will be available at `http://localhost:5173`

## Local API Server (Proxy)

This project includes a session-aware Express proxy (in `/api`) to handle Odoo API requests without CORS errors during development and standalone testing.

### When to use
- ✅ Standalone development (without full Odoo environment)
- ✅ Local development when experiencing CORS errors
- ❌ Production Odoo with properly configured CORS headers

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Configure environment variables in Vercel dashboard:
- `VITE_API_BASE_URL` - Your Odoo instance URL
- `VITE_USE_CORS_PROXY=true` - Enable proxy in production
- `VITE_CORS_PROXY_URL=/api/proxy` - Proxy endpoint

## Project Status

✅ CORS proxy implementation - Complete
✅ API client refactoring - Complete
✅ Environment configuration - Complete
✅ Documentation - Complete

## Related Projects

- **qonneq** - Odoo backend module
- **qariqa** - Reference implementation for CORS proxy solution

## License

Private - All rights reserved

---

**Last Updated:** 2026-01-23
**Version:** 1.0.0
