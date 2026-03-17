# Qonneq Portal - Quick Start Guide

Get up and running in 15 minutes!

## Prerequisites Checklist

- [ ] Odoo 14 installed and running
- [ ] PostgreSQL database for Odoo
- [ ] Node.js 18+ installed
- [ ] Python 3.8+ with pip

## 5-Minute Backend Setup

### 1. Install Python Dependency
```bash
cd odoo_module/qonneq_portal
pip install PyJWT==2.8.0
```

### 2. Copy Module to Odoo
```bash
# Windows
xcopy /E /I odoo_module\qonneq_portal "C:\Program Files\Odoo 14.0\server\odoo\addons\qonneq_portal"

# Linux
sudo cp -r odoo_module/qonneq_portal /opt/odoo/addons/
```

### 3. Restart Odoo
```bash
# Windows (if service)
net stop odoo-server && net start odoo-server

# Linux
sudo systemctl restart odoo
```

### 4. Install Module in Odoo
1. Open http://localhost:8069
2. Go to **Apps** > **Update Apps List**
3. Search "Qonneq Portal"
4. Click **Install**

### 5. Configure (IMPORTANT!)
**Settings > Technical > Parameters > System Parameters**

Update these 3 parameters:
```
qonneq.jwt_secret = CHANGE_ME_TO_RANDOM_STRING_123456789
qonneq.cors_origins = http://localhost:5173
qonneq.jwt_expiration = 86400
```

### 6. Create Test User
**Settings > Users > Create**
```
Name: Test Portal User
Email: portal@test.com
User Type: Portal
Password: portal123
```

**Important:** Assign user to a Partner (company) in the Contact section!

### 7. Create Test Data
**Qonneq > Machines > Create**
```
Name: Test Machine
Machine ID: MC001
Brand: La Cimbali
Model: M100
Customer: [Select the partner from step 6]
Status: Online
Current Temperature: 92
Daily Coffee Count: 50
```

✅ **Backend Ready!**

---

## 5-Minute Frontend Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify Environment Config
The `.env` file should already exist. Check it contains:
```bash
VITE_API_BASE_URL=http://localhost:8069
```

### 3. Start Development Servers
In separate terminals, run:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Local API Server (Proxy)
npm run dev:api
```

✅ **Frontend running at http://localhost:5173**

---

## Test the Integration

### 1. Test Login
1. Open http://localhost:5173/login
2. Enter:
   - Username: `portal@test.com`
   - Password: `portal123`
3. Click **Sign In**

✅ **You should be redirected to /dashboard**

### 2. View Dashboard (Mock Data)
The dashboard should load with mock data by default.

### 3. Switch to Real API Data

Edit `src/pages/Dashboard.tsx`:

**Change line 12-13 from:**
```typescript
import { useMachineData } from "@/hooks/useMachineData";
import { useCustomerData } from "@/hooks/useCustomerData";
```

**To:**
```typescript
import { useApiMachineData as useMachineData } from "@/hooks/useApiMachineData";
import { useApiCustomerData as useCustomerData } from "@/hooks/useApiCustomerData";
```

Save the file. The dashboard should now show:
- The test machine you created (MC001)
- Customer data from Odoo
- Real-time data from the API

✅ **Integration Complete!**

---

## Troubleshooting

### Problem: Can't login

**Check:**
1. Is Odoo running? (http://localhost:8069)
2. Is the user type set to "Portal"?
3. Is password set correctly?
4. Check browser console for errors

**Fix:**
```bash
# Verify API works
curl -X POST http://localhost:8069/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","params":{"username":"portal@test.com","password":"portal123"},"id":1}'
```

### Problem: CORS errors

**Check:**
Browser console shows: `blocked by CORS policy`

**Fix:**
1. Go to Odoo: Settings > Technical > System Parameters
2. Check `qonneq.cors_origins` = `http://localhost:5173`
3. Restart Odoo
4. Clear browser cache (Ctrl+Shift+Delete)

### Problem: Empty dashboard

**Check:**
1. Are machines created in Odoo?
2. Are machines assigned to the portal user's partner?
3. Check Network tab in DevTools - is API returning data?

**Fix:**
Go to Odoo > Qonneq > Machines and verify:
- At least one machine exists
- Machine's Customer field matches portal user's partner

### Problem: Module won't install

**Check:**
1. Is module in the correct addons path?
2. Is PyJWT installed?
3. Check Odoo logs for errors

**Fix:**
```bash
# Check Odoo can find the module
grep -r "qonneq_portal" /opt/odoo/addons/

# Check PyJWT
python -c "import jwt; print(jwt.__version__)"

# Check Odoo logs
tail -f /var/log/odoo/odoo-server.log
```

---

## Quick Commands Reference

### Restart Odoo (Windows)
```cmd
net stop odoo-server && net start odoo-server
```

### Restart Odoo (Linux)
```bash
sudo systemctl restart odoo
```

### View Odoo Logs (Linux)
```bash
tail -f /var/log/odoo/odoo-server.log
```

### React Dev Server
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Test API Endpoints
```bash
# Login
curl -X POST http://localhost:8069/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","params":{"username":"portal@test.com","password":"portal123"},"id":1}'

# Get machines (replace TOKEN)
curl -X POST http://localhost:8069/api/machines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"jsonrpc":"2.0","params":{},"id":1}'
```

---

## Next Steps

### Development
- [ ] Add more test machines and customers
- [ ] Test with different user roles
- [ ] Customize UI to match brand
- [ ] Add more dashboard features
- [ ] Set up git repository

### Production
- [ ] Read SETUP.md for production deployment
- [ ] Generate secure JWT secret
- [ ] Set up HTTPS for both frontend and backend
- [ ] Configure production CORS
- [ ] Import real customer data
- [ ] Set up monitoring and backups

---

## Need More Help?

📖 **Full Documentation:**
- [SETUP.md](./SETUP.md) - Complete setup guide
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Technical details
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Project overview
- [odoo_module/README.md](./odoo_module/README.md) - API documentation

🐛 **Debugging:**
1. Check Odoo logs: `/var/log/odoo/odoo-server.log`
2. Check browser console (F12)
3. Check Network tab in DevTools
4. Verify configuration in Odoo System Parameters

💡 **Tips:**
- Use mock data for UI development
- Switch to real API when backend is ready
- Keep Odoo and React dev servers running simultaneously
- Use browser DevTools to debug API calls

---

**Happy coding! 🚀**
