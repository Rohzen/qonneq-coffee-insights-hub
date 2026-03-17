# Machine Management Enhancement Implementation Plan

## Overview
Unify machine list and detail views across user dashboard and admin area, with the following enhancements:

## Phase 1: Machine List Enhancements

### 1.1 Update Portal Machines API to include company name
**File:** `api/machines/list.ts`
- Add LEFT JOIN with companies table
- Return `company_name` (or `customer_name` for consistency) field

### 1.2 Update MachinesList.tsx (User Dashboard)
**File:** `src/components/dashboard/MachinesList.tsx`
- Add "Azienda" (Company) column to the table
- Map company name from API response
- Ensure table layout matches admin view

### 1.3 Update MachineManagement.tsx (Admin Area)
**File:** `src/components/admin/MachineManagement.tsx`
- Ensure table columns are identical to user dashboard:
  - Modello, Brand, Famiglia, Seriale, Filtro Acqua, Azienda, Ultima Sincronizzazione, Stato, Allarme

## Phase 2: Unified Machine Detail Component

### 2.1 Create UnifiedMachineDetail.tsx
**File:** `src/components/shared/UnifiedMachineDetail.tsx`
- Based on dashboard MachineDetail.tsx template
- Accept `isAdmin` prop to control editable features
- Features:
  - Date range selection wizard for telemetry (from AdminMachineDetail)
  - Tree view for telemetry records
  - Water filter (BRITA) selection (editable only in admin mode)
  - KB data tracking for telemetry

### 2.2 Components needed:
- TelemetryDateRangeDialog - Date range selection
- TelemetryRecordsTree - Tree view with columns for telemetry data
- WaterFilterSelector - BRITA machine selection (editable in admin)

### 2.3 Update both dashboard and admin to use UnifiedMachineDetail
- MachinesList.tsx: Pass isAdmin={false}
- MachineManagement.tsx: Pass isAdmin={true}

## Phase 3: Database Schema Additions

### 3.1 Add water_filter_id to machines table
```sql
ALTER TABLE machines ADD COLUMN water_filter_machine_id UUID REFERENCES machines(id);
```

### 3.2 Add telemetry_downloads table for KB tracking
```sql
CREATE TABLE telemetry_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_id UUID REFERENCES machines(id),
    user_id UUID REFERENCES users(id),
    downloaded_at TIMESTAMP DEFAULT NOW(),
    data_size_kb DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    records_count INTEGER
);
```

## Implementation Order:
1. Phase 1.1: API update for company name
2. Phase 1.2-1.3: Machine list UI updates
3. Phase 2.1-2.3: Unified machine detail component
4. Phase 3: Database schema updates (optional, for persistence)
