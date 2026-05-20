# Outing Scheduler & Live TV Board — Implementation Plan

## Part 1 — Scheduler (Outing Status Automation)

### Package Required

```bash
yarn add @nestjs/schedule
```

### Cron Job — Runs Every Minute (`* * * * *`)

#### Step 1: Process Departures (`out_from` time reached)

1. Get current date (`today`) and current time as `HH:mm`
2. Query `outing_requests` where:
   - `log_date = today`
   - `status = 'active'`
   - `out_from` starts with `currentTime` (e.g. `out_from LIKE '10:00%'`)
3. For each matching outing:
   - Find the `attendance_log` for that `staffId + log_date`
   - **If log exists** → set `status = 'out'`, `checkout_time = out_from`
   - **If no log** (future-date outing applied yesterday, staff hasn't checked in yet) → create a new log with `status = 'out'`, no `checkin_time`, `checkout_time = out_from`

#### Step 2: Process Returns (`resume_time` reached)

1. Same current date + time
2. Query `outing_requests` where:
   - `log_date = today`
   - `status = 'active'`
   - `will_resume = true`
   - `resume_time` starts with `currentTime`
3. For each matching outing:
   - Find the `attendance_log` for that `staffId + log_date`
   - Update log: `status = 'present'`, set `checkout_time = NULL` (they're back)
   - Update outing: `status = 'resumed'`, `resumed_at = now()`

### Files to Create/Modify

| File                            | Action                                                               |
| ------------------------------- | -------------------------------------------------------------------- |
| `attendance.scheduler.ts` (new) | Contains `@Cron('* * * * *')` method, calls service methods          |
| `attendance.service.ts`         | Add `processOutingDepartures()` and `processOutingReturns()` methods |
| `attendance.module.ts`          | Import `ScheduleModule.forRoot()`, register scheduler as provider    |

---

## Part 2 — Fix `getDailySummary` (Richer Status)

The existing `getDailySummary` only checks for `status = 'present'` in `attendance_logs`. It must be updated to:

1. Also query logs with `status = 'out'` → build `outSet`
2. Also query active `outing_requests` for that date as fallback → build `outingSet`
3. Include `remarks` from the latest `attendance_log` per staff
4. Status priority:
   ```
   holiday → out → present → leave → absent
   ```
5. Return type expands to: `'present' | 'out' | 'leave' | 'absent' | 'holiday'`
6. Each staff entry includes `remarks` field for TV display

---

## Part 3 — Live TV Board (SSE Endpoint)

### Architecture

```
┌──────────────┐         SSE Stream          ┌──────────────┐
│   Backend    │ ──────────────────────────►  │   Frontend   │
│  NestJS API  │   GET /attendance/live-board │  (TV Screen) │
└──────────────┘                              └──────────────┘
```

### Backend — SSE Endpoint

- **Endpoint:** `GET /attendance/live-board`
- Returns `Content-Type: text/event-stream`
- Uses NestJS `@Sse()` decorator which returns an `Observable<MessageEvent>`
- Pushes fresh `getDailySummary` data every **30 seconds** (interval-based)
- Also pushes immediately when the scheduler processes a departure/return (event-driven via `EventEmitter2`)

### Frontend — EventSource (TV Screen)

> **Yes, SSE is consumed on the frontend.** The backend only provides the stream endpoint.

The frontend (TV screen) implementation:

```javascript
const source = new EventSource('https://your-api.com/attendance/live-board');

source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.staff = [{ name, contactNo, status, remarks }, ...]
  // Re-render the TV table with this data
  updateTVDisplay(data);
};

source.onerror = () => {
  // Auto-reconnects (built into EventSource)
  console.log('Connection lost, reconnecting...');
};
```

### Data Shape Pushed to Frontend

```json
{
  "date": "2026-05-20",
  "isHoliday": false,
  "staff": [
    {
      "name": "John Doe",
      "contactNo": "9841234567",
      "status": "present",
      "remarks": null
    },
    {
      "name": "Jane Smith",
      "contactNo": "9849876543",
      "status": "out",
      "remarks": "Client meeting — returning 14:30"
    }
  ],
  "summary": {
    "totalStaff": 25,
    "presentCount": 20,
    "outCount": 2,
    "leaveCount": 2,
    "absentCount": 1
  }
}
```

---

## Execution Order

```
1. yarn add @nestjs/schedule
2. Fix getDailySummary (add 'out' status + remarks)
3. Add processOutingDepartures() + processOutingReturns() to AttendanceService
4. Create AttendanceScheduler with @Cron('* * * * *')
5. Register ScheduleModule + scheduler in AttendanceModule
6. Add SSE endpoint: GET /attendance/live-board (backend)
7. Frontend TV screen connects via EventSource (frontend)
```

---

## Summary

| Component                     | Where                                                         |
| ----------------------------- | ------------------------------------------------------------- |
| Scheduler (cron every minute) | **Backend** — auto-updates DB at `out_from` and `resume_time` |
| SSE endpoint (`/live-board`)  | **Backend** — streams current status to connected clients     |
| EventSource consumer          | **Frontend** — TV screen listens and renders the table        |
| `getDailySummary` fix         | **Backend** — returns `'out'` status + `remarks`              |
