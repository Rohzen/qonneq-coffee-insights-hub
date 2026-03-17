# Qonneq Portal - Integration Guide

## Overview

This document explains how the React frontend integrates with the Odoo backend.

## Architecture Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     User Browser                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  React App (http://localhost:5173)                     │  │
│  │  - AuthContext provides authentication state           │  │
│  │  - ProtectedRoute guards dashboard access              │  │
│  │  - API hooks fetch data from Odoo (via Proxy)         │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│                    JWT Token in                                │
│                    localStorage                                │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           │ Authorization: Bearer <token>
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│              Odoo Server (http://localhost:8069)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CORS Middleware                                         │  │
│  │  - Checks Origin header                                  │  │
│  │  - Adds CORS headers to response                         │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │  API Controllers                                         │  │
│  │  - /api/auth/login (public)                              │  │
│  │  - /api/auth/verify (public)                             │  │
│  │  - /api/customers (@jwt_required)                        │  │
│  │  - /api/machines (@jwt_required)                         │  │
│  │  - /api/dashboard/stats (@jwt_required)                  │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │  JWT Decorator                                           │  │
│  │  - Extracts token from Authorization header              │  │
│  │  - Verifies signature and expiration                     │  │
│  │  - Passes user_id and partner_id to controller           │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │  Odoo ORM & Models                                       │  │
│  │  - qonneq.machine                                        │  │
│  │  - qonneq.machine.telemetry                              │  │
│  │  - qonneq.machine.alert                                  │  │
│  │  - res.partner (extended)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                     │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │  PostgreSQL Database                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### 1. Login Process

```javascript
// User submits login form
User enters: email + password
    ↓
// Frontend: src/pages/Login.tsx
const { login } = useAuth();
await login(username, password);
    ↓
// Frontend: src/context/AuthContext.tsx
const response = await apiClient.login(username, password);
    ↓
// Frontend: src/lib/api/client.ts
POST http://localhost:8069/api/auth/login
Headers: { "Content-Type": "application/json" }
Body: {
  "jsonrpc": "2.0",
  "params": { "username": "...", "password": "..." }
}
    ↓
// Backend: controllers/auth.py
@http.route('/api/auth/login', auth='public')
def login():
    uid = request.session.authenticate(db, username, password)
    token = self._generate_token(uid, partner_id)
    return { "success": True, "token": token, "user": {...} }
    ↓
// Frontend stores token
localStorage.setItem('qonneq_auth_token', token);
localStorage.setItem('qonneq_user', JSON.stringify(user));
    ↓
// Redirect to dashboard
navigate('/dashboard');
```

### 2. Authenticated Request Flow

```javascript
// User navigates to dashboard
    ↓
// Frontend: src/components/ProtectedRoute.tsx
const { isAuthenticated } = useAuth();
if (!isAuthenticated) → redirect to /login
    ↓
// Frontend: src/hooks/useApiMachineData.ts
useEffect(() => {
    fetchMachines();
}, [isAuthenticated]);
    ↓
// Frontend: src/lib/api/client.ts
const token = localStorage.getItem('qonneq_auth_token');
GET http://localhost:8069/api/machines
Headers: {
    "Authorization": "Bearer eyJ0eXAiOiJKV1Qi...",
    "Content-Type": "application/json"
}
    ↓
// Backend: controllers/cors.py (middleware)
origin = request.headers.get('Origin')
if origin in allowed_origins:
    response.headers['Access-Control-Allow-Origin'] = origin
    ↓
// Backend: controllers/api.py
@http.route('/api/machines', auth='public', cors='*')
@jwt_required
def get_machines(**kwargs):
    user_id = kwargs.get('_user_id')
    partner_id = kwargs.get('_partner_id')
    ↓
    # Check user permissions
    user = request.env['res.users'].sudo().browse(user_id)
    if user.has_group('base.group_user'):
        machines = env['qonneq.machine'].sudo().search([])
    else:
        machines = env['qonneq.machine'].sudo().search([
            ('customer_id', '=', partner_id)
        ])
    ↓
    return { "success": True, "data": machines_data }
    ↓
// Frontend receives data
setMachines(response.data);
```

## Data Models Mapping

### Odoo Model → TypeScript Interface

**qonneq.machine → MachineData**

```python
# Odoo: models/machine.py
class Machine(models.Model):
    _name = 'qonneq.machine'

    machine_id = fields.Char()
    brand = fields.Char()
    model = fields.Char()
    status = fields.Selection([...])
    current_temperature = fields.Float()
    # ... etc
```

```typescript
// React: src/types/dashboard.ts
export interface MachineData {
  id: string;
  brand: string;
  model: string;
  status: 'online' | 'offline' | 'warning';
  temperature: number;
  // ... etc
}
```

**res.partner → CustomerData**

```python
# Odoo: models/customer_extension.py
class ResPartner(models.Model):
    _inherit = 'res.partner'

    machine_ids = fields.One2many('qonneq.machine', 'customer_id')
    contract_type = fields.Selection([...])
    # ... etc
```

```typescript
// React: src/types/dashboard.ts
export interface CustomerData {
  id: string;
  name: string;
  contract: string;
  machinesCount: number;
  machines: MachineData[];
  // ... etc
}
```

## API Response Format

### Odoo JSON-RPC Format

All Odoo API responses follow this structure:

```json
{
  "jsonrpc": "2.0",
  "id": 1234567890,
  "result": {
    "success": true,
    "data": { ... }
  }
}
```

Or for errors:

```json
{
  "jsonrpc": "2.0",
  "id": 1234567890,
  "error": {
    "code": 200,
    "message": "Error message",
    "data": { ... }
  }
}
```

### Frontend API Client Handling

The `apiClient` in `src/lib/api/client.ts` unwraps this:

```typescript
// Odoo returns: { jsonrpc: "2.0", result: { success: true, data: [...] } }
// Client returns: { success: true, data: [...] }

const response = await apiClient.getMachines();
if (response.success) {
  const machines = response.data; // Already unwrapped!
}
```

## Security

### JWT Token Structure

```json
{
  "user_id": 7,
  "partner_id": 14,
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Permission Checks

**Portal Users:**
- Can only see their own partner's data
- `@jwt_required` decorator checks partner_id
- Odoo domain filters: `[('customer_id', '=', partner_id)]`

**Admin Users:**
- Can see all data
- Check: `user.has_group('base.group_user')`
- No domain filters applied

### CORS Security

Only configured origins can access the API:

```python
# In Odoo system parameters
qonneq.cors_origins = http://localhost:5173,https://yourapp.com

# CORS middleware checks:
if origin in allowed_origins:
    response.headers['Access-Control-Allow-Origin'] = origin
```

## Error Handling

### Frontend Error Handling

```typescript
// src/hooks/useApiMachineData.ts
const [error, setError] = useState<string | null>(null);

try {
  const response = await apiClient.getMachines();
  if (response.success) {
    setMachines(response.data);
  } else {
    setError(response.error);
  }
} catch (err) {
  setError('An error occurred');
}
```

### Backend Error Handling

```python
# controllers/api.py
try:
    machines = request.env['qonneq.machine'].sudo().search([])
    return {
        'success': True,
        'data': machines_data
    }
except Exception as e:
    _logger.error('Error: %s', str(e))
    return {
        'success': False,
        'error': 'Failed to retrieve machines'
    }
```

## Environment Configuration

### Development

**Frontend (.env):**
```bash
VITE_API_BASE_URL=http://localhost:8069
```

**Backend (Odoo config):**
```ini
[options]
xmlrpc_port = 8069
# ... other settings
```

**CORS:**
```
qonneq.cors_origins = http://localhost:5173
```

### Production

**Frontend (.env.production):**
```bash
VITE_API_BASE_URL=https://odoo.yourcompany.com
```

**Backend:**
- Enable HTTPS
- Set proper JWT secret
- Restrict CORS to production domain only

## Testing the Integration

### 1. Test Backend API Directly

```bash
# Test login
curl -X POST http://localhost:8069/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "params": {"username": "portal@test.com", "password": "portal123"},
    "id": 1
  }'

# Test authenticated endpoint (use token from login response)
curl -X POST http://localhost:8069/api/machines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"jsonrpc": "2.0", "params": {}, "id": 1}'
```

### 2. Test Frontend Integration

```bash
# Start Odoo (backend)
# ... (Odoo should be running on port 8069)

# Start React (frontend)
npm run dev

# Open browser
http://localhost:8080/login

# Login and check:
# - Network tab for API requests
# - Console for errors
# - Application > Local Storage for token
```

### 3. Check CORS

Open browser console and look for errors like:
```
Access to fetch at 'http://localhost:8069/api/auth/login' from origin
'http://localhost:5173' has been blocked by CORS policy
```

If you see this:
1. Verify `qonneq.cors_origins` includes `http://localhost:5173`
2. Restart Odoo
3. Clear browser cache

## Switching Between Mock and Real Data

The project supports both modes for development:

### Mock Data (Default)
```typescript
// src/pages/Dashboard.tsx
import { useMachineData } from "@/hooks/useMachineData";
import { useCustomerData } from "@/hooks/useCustomerData";
```

### Real API
```typescript
// src/pages/Dashboard.tsx
import { useApiMachineData as useMachineData } from "@/hooks/useApiMachineData";
import { useApiCustomerData as useCustomerData } from "@/hooks/useApiCustomerData";
```

The hooks have the same interface, so no other code changes needed!

## Deployment Checklist

### Backend (Odoo)

- [ ] Install qonneq_portal module
- [ ] Set strong JWT secret
- [ ] Configure production CORS origins
- [ ] Enable HTTPS
- [ ] Create portal users
- [ ] Add production data
- [ ] Test API endpoints
- [ ] Set up database backups

### Frontend (React)

- [ ] Update .env.production with Odoo URL
- [ ] Build: `npm run build`
- [ ] Test build locally: `npm run preview`
- [ ] Deploy dist folder
- [ ] Update Odoo CORS with production URL
- [ ] Test login flow
- [ ] Test data loading
- [ ] Check browser console for errors

## Common Integration Issues

### Issue: "Invalid token"
**Cause:** Token expired or JWT secret changed
**Fix:** Re-login to get new token

### Issue: "Access denied"
**Cause:** Portal user trying to access admin data
**Fix:** Check user permissions and data ownership

### Issue: Empty data returned
**Cause:** No machines assigned to user's partner
**Fix:** Assign machines to the partner in Odoo

### Issue: CORS errors
**Cause:** Origin not in allowed list
**Fix:** Add origin to `qonneq.cors_origins` and restart Odoo

### Issue: 404 on API endpoints
**Cause:** Module not installed or Odoo not restarted
**Fix:** Install module and restart Odoo

## Performance Optimization

### Frontend
- API responses are cached in component state
- Use React Query for advanced caching (future)
- Implement pagination for large datasets
- Add loading skeletons

### Backend
- Index frequently queried fields (machine_id, customer_id)
- Use `sudo()` sparingly, prefer proper access rights
- Implement API rate limiting (future)
- Add Redis for session caching (future)

## Monitoring

### Frontend
- Check browser DevTools > Network tab
- Monitor localStorage size
- Check for memory leaks in React DevTools

### Backend
- Monitor Odoo logs: `/var/log/odoo/odoo-server.log`
- Check PostgreSQL query performance
- Monitor API response times
- Set up error tracking (Sentry, etc.)

---

For more details, see:
- [SETUP.md](./SETUP.md) - Complete setup instructions
- [odoo_module/README.md](./odoo_module/README.md) - Odoo module documentation
- [README.md](./README.md) - Project overview
