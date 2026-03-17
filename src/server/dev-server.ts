import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Logger middleware for all requests
app.use((req, res, next) => {
    console.log(`[Dev Server] ${req.method} ${req.url}`);
    next();
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Wrapper for Vercel functions to work with Express
const wrap = (handler: any) => async (req: any, res: any) => {
    const vercelReq = {
        ...req,
        query: { ...req.query, ...req.params },
        body: req.body,
        headers: req.headers,
        method: req.method,
        url: req.url
    };

    const vercelRes = {
        status: (code: number) => {
            res.status(code);
            return vercelRes;
        },
        json: (data: any) => {
            res.json(data);
            return vercelRes;
        },
        send: (data: any) => {
            res.send(data);
            return vercelRes;
        },
        setHeader: (name: string, value: string) => {
            res.setHeader(name, value);
            return vercelRes;
        },
        end: () => res.end()
    };

    try {
        console.log(`[Dev Server] Handler Match: ${req.method} ${req.url}`);
        console.log(`[Dev Server] Params:`, req.params);
        console.log(`[Dev Server] Query:`, req.query);
        await handler(vercelReq, vercelRes);
    } catch (err) {
        console.error('API Error in dev server wrapper:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error', details: err instanceof Error ? err.message : String(err) });
    }
};

// Dynamically import handlers
// Note: We use .ts extensions because tsx handles them
import loginHandler from './auth/login.ts';
import verifyHandler from './auth/verify.ts';
import registerHandler from './auth/register.ts';
import machinesHandler from './machines/index.ts';
import portalMachinesHandler from './machines/list.ts';
import statsHandler from './dashboard/stats.ts';
import credsHandler from './settings/credentials.ts';
import saveCredsHandler from './settings/credentials/save.ts';
import listCustomersHandler from './customers/index.ts';
import createCustomerHandler from './admin/customers/create.ts';
import createUserHandler from './admin/users/create.ts';
import listUsersHandler from './admin/users/list.ts';
import deleteUserHandler from './admin/users/delete.ts';
import updateUserHandler from './admin/users/update.ts';
import createMachineHandler from './admin/machines/create.ts';
import listMachinesHandler from './admin/machines/list.ts';
import adminMachineDetailHandler from './admin/machines/detail.ts';
import adminMachineTelemetryHandler from './admin/machines/telemetry.ts';
import machineTelemetryHandler from './machines/telemetry.ts';
import listCustCredsHandler from './admin/customers/list-credentials.ts';
import saveCustCredHandler from './admin/customers/save-credential.ts';
import syncCredsHandler from './admin/credentials/sync.ts';
import testCredsHandler from './admin/credentials/test.ts';
import deleteCredHandler from './admin/credentials/delete.ts';
import deleteCustomerHandler from './admin/customers/delete.ts';
import britaDetailHandler from './admin/machines/brita-detail.ts';
import britaListHandler from './admin/machines/brita-list.ts';
import enrichmentWeatherHandler from './enrichment/weather-hourly.ts';
import enrichmentEventsHandler from './enrichment/events.ts';
import enrichmentFootfallHandler from './enrichment/footfall.ts';
import enrichmentContextHandler from './enrichment/context.ts';
import smartAnalyticsHandler from './analytics/smart.ts';

// Auth routes
app.post('/api/auth/login', wrap(loginHandler));
app.post('/api/auth/verify', wrap(verifyHandler));
app.post('/api/auth/register', wrap(registerHandler));

// Dashboard & Machines
app.post('/api/dashboard/stats', wrap(statsHandler));
app.post('/api/machines', wrap(machinesHandler));
app.get('/api/machines/list', wrap(portalMachinesHandler));
app.get('/api/machines/:serial/telemetry', wrap(machineTelemetryHandler));

// Settings
app.post('/api/settings/credentials', wrap(credsHandler));
app.post('/api/settings/credentials/save', wrap(saveCredsHandler));

// Admin & Customers
app.use('/api/admin/customers', (req, res, next) => {
    console.log(`[Dev Server Admin] ${req.method} ${req.url} (at /api/admin/customers)`);
    next();
});

app.get('/api/customers', wrap(listCustomersHandler));
app.post('/api/admin/customers/create', wrap(createCustomerHandler));
app.get('/api/admin/customers/:customerId/credentials', wrap(listCustCredsHandler));
app.post('/api/admin/customers/:customerId/credentials', wrap(saveCustCredHandler));
app.post('/api/admin/credentials/:credentialId/test', wrap(testCredsHandler));
app.post('/api/admin/credentials/:credentialId/sync', wrap(syncCredsHandler));
app.delete('/api/admin/credentials/:credentialId', wrap(deleteCredHandler));
app.delete('/api/admin/customers/:customerId', wrap(deleteCustomerHandler));
app.post('/api/admin/users/create', wrap(createUserHandler));
app.post('/api/admin/machines/create', wrap(createMachineHandler));
app.get('/api/admin/machines', wrap(listMachinesHandler));
app.get('/api/admin/machines/list', wrap(listMachinesHandler));
app.get('/api/admin/machines/brita-detail', wrap(britaDetailHandler));
app.get('/api/admin/machines/brita-list', wrap(britaListHandler));
app.get('/api/admin/machines/:machineId/detail', wrap(adminMachineDetailHandler));
app.get('/api/admin/machines/:machineId/telemetry', wrap(adminMachineTelemetryHandler));
app.get('/api/admin/users', wrap(listUsersHandler));
app.get('/api/admin/users/list', wrap(listUsersHandler));
app.delete('/api/admin/users/delete', wrap(deleteUserHandler));
app.post('/api/admin/users/delete', wrap(deleteUserHandler));
app.put('/api/admin/users/update', wrap(updateUserHandler));
app.post('/api/admin/users/update', wrap(updateUserHandler));

// Enrichment routes
app.get('/api/enrichment/weather-hourly', wrap(enrichmentWeatherHandler));
app.get('/api/enrichment/events', wrap(enrichmentEventsHandler));
app.get('/api/enrichment/footfall', wrap(enrichmentFootfallHandler));
app.get('/api/enrichment/context', wrap(enrichmentContextHandler));

// Analytics routes
app.get('/api/analytics/smart', wrap(smartAnalyticsHandler));

// Catch-all for 404s to help debugging
app.use((req, res) => {
    console.log(`[Dev Server] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\x1b[32m%s\x1b[0m`, `✔ Local API Server [v2.1] running at http://localhost:${PORT}`);
    console.log(`[Dev Server] Standardized routes for :customerId and :credentialId are ready.`);
});
