# Qonneq Portal - Complete Setup Guide

This guide will walk you through setting up both the Odoo backend and React frontend for the Qonneq Portal.

## Architecture Overview

```
┌─────────────────────────────┐
│  React Frontend             │
│  - Vite + TypeScript        │
│  - shadcn/ui Components     │
│  - JWT Authentication       │
│  - Port: 5173 (dev)         │
└──────────────┬──────────────┘
               │
               │ REST API (Proxy)
               ▼
┌─────────────────────────────┐
│  Local Dev Server (API)     │
│  - Express Proxy            │
│  - Environment: Port 3001   │
└──────────────┬──────────────┘
               │
               │ REST API (Odoo)
               ▼
┌─────────────────────────────┐
│  Odoo 14 Backend            │
│  - Custom Module            │
│  - Models & Controllers     │
│  - CORS Enabled             │
│  - Port: 8069 (default)     │
└─────────────────────────────┘
```

## Prerequisites

### Backend (Odoo 14)
- Python 3.8+
- PostgreSQL 12+
- Odoo 14 installed and running
- pip (Python package manager)

### Frontend (React)
- Node.js 18+ and npm
- Git

---

## Part 1: Odoo Backend Setup

### Step 1: Install Python Dependencies

```bash
# Navigate to the module directory
cd odoo_module/qonneq_portal

# Install PyJWT (required for JWT authentication)
pip install -r requirements.txt
```

### Step 2: Copy Module to Odoo Addons

Copy the `qonneq_portal` folder to your Odoo addons directory.

**On Windows:**
```cmd
# Example path - adjust to your Odoo installation
xcopy /E /I odoo_module\qonneq_portal "C:\Program Files\Odoo 14.0\server\odoo\addons\qonneq_portal"
```

**On Linux:**
```bash
# Example path - adjust to your Odoo installation
sudo cp -r odoo_module/qonneq_portal /opt/odoo/addons/
sudo chown -R odoo:odoo /opt/odoo/addons/qonneq_portal
```

### Step 3: Restart Odoo

Restart your Odoo server to recognize the new module.

**Windows (if running as service):**
```cmd
net stop odoo-server
net start odoo-server
```

**Linux:**
```bash
sudo systemctl restart odoo
# OR
sudo service odoo restart
```

**Development mode:**
```bash
# From Odoo directory
python odoo-bin -c odoo.conf --dev=all
```

### Step 4: Install the Module

1. Open Odoo in your browser (usually http://localhost:8069)
2. Login as administrator
3. Go to **Apps** menu
4. Click **Update Apps List** (top-left)
5. Search for "Qonneq Portal"
6. Click **Install**

### Step 5: Configure System Parameters

After installation, configure these critical parameters:

1. Go to **Settings > Technical > Parameters > System Parameters**

2. Update these parameters:

   | Key | Value | Description |
   |-----|-------|-------------|
   | `qonneq.jwt_secret` | `YOUR_SECRET_KEY_HERE` | **IMPORTANT:** Change this to a random string in production! |
   | `qonneq.jwt_expiration` | `86400` | Token expiration in seconds (24 hours) |
   | `qonneq.cors_origins` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed origins |

   **Generate a secure JWT secret:**
   ```bash
   # On Linux/Mac
   openssl rand -hex 32

   # On Windows (PowerShell)
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

### Step 6: Create Portal User

1. Go to **Settings > Users & Companies > Users**
2. Click **Create**
3. Fill in:
   - Name: Test Portal User
   - Email: `portal@test.com`
   - User Type: **Portal**
4. Click **Save**
5. Go to **Action > Change Password** and set a password (e.g., `portal123`)
6. In the **Contact** section, assign the user to a Partner (company)

### Step 7: Create Test Data

For testing, create some sample machines and customers:

1. **Create a Customer (Partner):**
   - Go to **Contacts**
   - Create a new contact
   - Check "Is a Company"
   - Fill in name, address, etc.
   - In the **Qonneq Portal** tab:
     - Set Contract Type: "Premium"
     - Set Contract Start Date
     - Set Accessories Count: 5

2. **Create Machines:**
   - Go to **Qonneq > Machines**
   - Create new machines:
     ```
     Machine 1:
     - Name: Coffee Machine 1
     - Machine ID: MC001
     - Brand: La Cimbali
     - Model: M100 HD DT3
     - Customer: [Select the customer created above]
     - Status: Online
     - Current Temperature: 92
     - Daily Coffee Count: 78
     - Monthly Total Count: 1247
     - Next Maintenance Date: [30 days from now]
     ```
   - Create 2-3 more machines with different data

3. **Add Telemetry Data (optional):**
   - Open a machine
   - Go to **Telemetry Data** tab
   - Add some sample readings

### Step 8: Test the API

Test that the API is working:

**Using curl:**
```bash
# Test login
curl -X POST http://localhost:8069/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "username": "portal@test.com",
      "password": "portal123"
    },
    "id": 1
  }'

# Expected response:
# {
#   "jsonrpc": "2.0",
#   "id": 1,
#   "result": {
#     "success": true,
#     "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#     "user": {...}
#   }
# }
```

---

## Part 2: React Frontend Setup

### Step 1: Install Dependencies

```bash
# From the project root directory
npm install
```

### Step 2: Configure Environment

The `.env` file should already be created. Verify it contains:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8069
VITE_API_AUTH_LOGIN=/api/auth/login
VITE_API_AUTH_VERIFY=/api/auth/verify
VITE_API_AUTH_LOGOUT=/api/auth/logout
VITE_API_CUSTOMERS=/api/customers
VITE_API_MACHINES=/api/machines
VITE_API_DASHBOARD_STATS=/api/dashboard/stats
VITE_ENVIRONMENT=development
```

**For production**, copy `.env.example` to `.env.production` and update:
```bash
VITE_API_BASE_URL=https://your-odoo-domain.com
```

### Step 3: Update Dashboard to Use API

The hooks have been created. You can choose to use either:
- **Mock data** (current): `useMachineData` and `useCustomerData`
- **Real API** (new): `useApiMachineData` and `useApiCustomerData`

To switch to real API, update `src/pages/Dashboard.tsx`:

```typescript
// Change from:
import { useMachineData } from "@/hooks/useMachineData";
import { useCustomerData } from "@/hooks/useCustomerData";

// To:
import { useApiMachineData as useMachineData } from "@/hooks/useApiMachineData";
import { useApiCustomerData as useCustomerData } from "@/hooks/useApiCustomerData";
```

### Step 4: Start Development Servers

In separate terminals, run:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Local API Server (Proxy)
npm run dev:api
```

The app will be available at: http://localhost:5173

### Step 5: Test the Login

1. Navigate to http://localhost:8080/login
2. Enter credentials:
   - Username: `portal@test.com`
   - Password: `portal123`
3. Click **Sign In**
4. You should be redirected to `/dashboard`

---

## Switching Between Mock and Real Data

The project supports both mock data (for development/demo) and real API data:

### Using Mock Data (Default)
Keep the imports as they are in Dashboard.tsx:
```typescript
import { useMachineData } from "@/hooks/useMachineData";
import { useCustomerData } from "@/hooks/useCustomerData";
```

### Using Real API Data
Update Dashboard.tsx imports:
```typescript
import { useApiMachineData as useMachineData } from "@/hooks/useApiMachineData";
import { useApiCustomerData as useCustomerData } from "@/hooks/useApiCustomerData";
```

The component code remains the same - the API hooks match the interface of the mock hooks.

---

## Troubleshooting

### CORS Errors

**Problem:** Browser console shows CORS errors

**Solutions:**
1. Verify `qonneq.cors_origins` includes your frontend URL (http://localhost:5173)
2. Restart Odoo after changing CORS settings
3. Check browser console for the exact Origin being sent
4. For development, you can temporarily set CORS origins to `*` (NOT for production!)

### Authentication Errors

**Problem:** Login fails with "Invalid username or password"

**Solutions:**
1. Verify user exists and has Portal access
2. Check password is set correctly
3. Verify user's partner is assigned
4. Check Odoo logs: `/var/log/odoo/odoo-server.log`

### JWT Errors

**Problem:** "Invalid token" or JWT-related errors

**Solutions:**
1. Ensure PyJWT is installed: `pip install PyJWT==2.8.0`
2. Verify `qonneq.jwt_secret` is set and not empty
3. Check token hasn't expired (default 24 hours)
4. Clear browser localStorage and re-login

### Module Not Found

**Problem:** Can't find qonneq_portal module after installation

**Solutions:**
1. Verify module is in correct addons directory
2. Check Odoo config file includes the addons path
3. Restart Odoo server
4. Update Apps List in Odoo
5. Check file permissions (Linux)

### API Returns Empty Data

**Problem:** Login works but no machines/customers shown

**Solutions:**
1. Create test data in Odoo (machines and customers)
2. Verify user's partner has machines assigned
3. Check browser DevTools Network tab for API responses
4. Verify Odoo security rules allow portal users to read data

---

## Production Deployment

### Backend (Odoo)

1. **Secure JWT Secret:**
   ```bash
   # Generate a strong secret
   openssl rand -hex 32
   # Update qonneq.jwt_secret parameter
   ```

2. **Update CORS Origins:**
   ```
   # Only allow your production domain
   qonneq.cors_origins = https://yourapp.com
   ```

3. **Enable HTTPS** on Odoo server

4. **Set up proper backup** for PostgreSQL database

### Frontend (React)

1. **Update .env.production:**
   ```bash
   VITE_API_BASE_URL=https://your-odoo-domain.com
   ```

2. **Build the app:**
   ```bash
   npm run build
   ```

3. **Deploy** the `dist` folder to your hosting (Netlify, Vercel, etc.)

4. **Update CORS** in Odoo to include production URL

---

## API Documentation

Full API documentation is available in `odoo_module/README.md`

### Quick Reference

**Authentication:**
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/verify` - Verify token validity
- `POST /api/auth/logout` - Logout

**Data Endpoints (require JWT):**
- `GET /api/customers` - Get all customers
- `GET /api/customers/<id>` - Get specific customer
- `GET /api/machines` - Get all machines
- `GET /api/machines/<id>` - Get specific machine
- `GET /api/machines/<id>/telemetry` - Get machine telemetry
- `GET /api/dashboard/stats` - Get dashboard statistics

---

## Support

For issues or questions:
1. Check Odoo logs
2. Check browser console
3. Verify all configuration steps
4. Review API documentation

## License

LGPL-3
