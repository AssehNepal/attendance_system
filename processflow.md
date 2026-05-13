# Dzongkhag Administration — Attendance System

## Process Flow & Database Schema (v2)

---

## 1. System Roles

| Role            | Table    | Scope       | Key Authorities                                                                                         |
| --------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| **Super Admin** | `admins` | All offices | Add / deactivate offices, **create admins per office**, manage global settings                          |
| **Admin**       | `admins` | One office  | Add / delete staff, edit attendance, manage holidays, **set office cutoff time directly**, view reports |
| **Employee**    | `staff`  | Self only   | Apply leave, apply outing, fill on-duty remarks via email                                               |

> **Super Admins and Admins are stored in the `admins` table. Employees are stored in the `staff` table. These are two completely separate user pools with separate login flows.**

---

## 2. Super Admin Flow

```
Super Admin logs in (email + password → admins table)
    │
    ├── Add new Dzongkhag office
    │       ├── Name, dzongkhag code, address, email domain
    │       └── Set office hours and default absence cutoff time
    │
    ├── Create Admin for that office
    │       ├── Required : name, email, password, office_id
    │       ├── admins row created : role = admin, office_id = <office>
    │       └── Admin receives login credentials via email
    │
    ├── Deactivate / reactivate Admin
    │       └── admins.is_active = false (admin loses access immediately)
    │
    ├── Manage global system settings
    │       └── Milvus face match threshold (system_settings table)
    │
    └── Deactivate office if no longer needed
            └── offices.is_active = false
```

---

## 3. Admin Flow

### 3.1 Staff Management

```
Admin logs in (email + password → admins table, role = admin)
    │
    ├── Add Employee
    │       ├── Required : Employee ID, Name, Contact No
    │       ├── Optional : Email, Designation, Department, Employment Type
    │       └── Enroll face into Milvus → milvus_vector_id saved to staff record
    │
    ├── Delete / Deactivate Employee
    │       └── is_active = false (record retained for audit history)
    │
    └── Manage Departments and assign Head of Department
```

### 3.2 Attendance Management

```
Admin views attendance
    │
    ├── Filter by date or month
    ├── View daily report per employee
    │       ├── First check-in time
    │       ├── Last check-out time
    │       ├── Total hours present
    │       ├── Total hours out
    │       ├── Status
    │       └── Time-wise remarks (e.g. 10:30 – 11:45 : Meeting with MoF)
    │
    ├── Edit any attendance record
    │       ├── Manually set check-in / check-out
    │       ├── Change status
    │       ├── Edit remarks
    │       └── Every edit logged in admin_overrides (audit trail)
    │
    └── View monthly summary per employee
            ├── Total days present
            ├── Total days absent
            ├── Total days on leave
            ├── Total working hours
            └── Average arrival time
```

### 3.3 Holiday Management

```
Admin opens Holiday Settings
    │
    ├── Mark by DAY (recurring weekly holiday)
    │       ├── Admin selects day/s (e.g. Sunday, Saturday)
    │       └── Every occurrence of that day across all dates
    │               ├── weekly_holidays row saved (day_of_week = 0 for Sunday)
    │               └── System suppresses attendance row creation on those days
    │                       └── Board suppressed or shows "Office Closed"
    │
    └── Mark by DATE (one-time specific holiday)
            ├── Admin selects a specific date (e.g. 17/12/2025)
            ├── Adds name (e.g. National Day, Coronation Day)
            ├── Selects type : public | restricted
            └── holidays row saved for that exact date only
                    └── System suppresses attendance row creation on that date
                            └── Board shows holiday name

    NOTE — Both checks run at the start of every day
            ├── weekly_holidays checked first (day of week match)
            └── holidays checked second (specific date match)
                    └── If either matches → no attendance rows created for that day
```

### 3.4 Absence Cutoff Time

```
Admin opens Office Settings
    │
    └── Edit Absence Cutoff Time
            ├── Default : 10:00 AM (global default set at office creation)
            ├── Admin sets new time directly on their office record (e.g. 09:30 AM)
            │       └── offices.absence_cutoff_time updated immediately
            └── Takes effect from the next working day onwards
                    └── Every change is logged in admin_overrides for audit trail
```

---

## 4. Daily Attendance Flow (System)

### 4.1 Start of Day — Holiday Check and Auto Row Creation

```
System runs at 00:01 AM each day
    │
    ├── Check weekly_holidays for this office
    │       └── Does today's day_of_week match any active row?
    │               └── YES → stop. No attendance rows created.
    │                         Board shows "Office Closed"
    │
    ├── Check holidays (specific dates) for this office
    │       └── Does today's date match any row?
    │               └── YES → stop. No attendance rows created.
    │                         Board shows holiday name
    │
    └── No holiday match → proceed
            └── For every active staff member
                    └── Create attendance_logs row
                            ├── status  = out
                            └── remarks = blank
```

### 4.2 Face Scan at Gate — Biometric

```
Employee approaches gate camera
    │
    ├── Face NOT recognised (below Milvus threshold)
    │       └── Alert shown on device → Admin notified
    │
    └── Face recognised → staff_id resolved from milvus_vector_id
            │
            └── Check last scan_logs entry for today
                    │
                    ├── No scan yet today  (odd scan = coming in)
                    │       ├── scan_logs row  : scan_type = checkin
                    │       └── attendance_logs: status = present
                    │                           checkin_time = now
                    │
                    └── Last scan was checkin  (even scan = going out)
                            ├── scan_logs row  : scan_type = on_duty
                            ├── attendance_logs: status = on_duty
                            │                   checkout_time = now
                            └── on_duty_remarks row created
                                    ├── out_time  = now  (pre-filled)
                                    ├── in_time   = null (filled on return)
                                    └── Email sent to staff with secure URL
```

### 4.3 Employee Returns from On-Duty

```
Employee scans face again (returning to office)
    │
    ├── scan_logs row    : scan_type = checkin
    ├── attendance_logs  : status = present
    └── on_duty_remarks row updated
            └── in_time = now (pre-filled)
                    └── Email form now shows complete time window
                            e.g. 10:30 – 11:45 : _______________
```

### 4.4 Absence Auto-Marking

```
System runs at cutoff time (admin-configurable, default 10:00 AM)
    │
    └── For every staff with status still = out
            └── attendance_logs : status = absent
```

### 4.5 End of Day

```
System runs at 5:00 PM
    │
    └── For every staff with status = present and no final checkout
            └── Last scan treated as end of day checkout
```

---

## 5. Employee Portal Flow

### 5.1 Leave Application

```
Employee opens portal → Apply Leave
    │
    ├── Fills : leave type, date from, date to, reason
    │
    └── Submitted
            ├── leave_requests : status = approved (auto, no HR step)
            └── System auto-creates attendance_logs for each leave day
                    ├── status  = on_leave
                    └── remarks = Will be back to office from DD/MM/YYYY
```

### 5.2 Outing Application

```
Employee opens portal → Apply Outing
    │
    ├── Will you resume office today?
    │
    ├── YES
    │       ├── Fill return time (HH:MM)
    │       ├── outing_requests : will_resume = true, resume_time = HH:MM
    │       └── attendance_logs : remarks = Will be back to office from HH:MM
    │
    └── NO
            ├── outing_requests : will_resume = false
            └── attendance_logs : remarks = blank

    NOTE — If outing is applied BEFORE check-in that day
            └── will_resume = true by default
                resume_time = time of application
```

### 5.3 On-Duty Remarks (via Email)

```
Staff receives email after 2nd face scan
    │
    └── Clicks URL → opens secure form (token valid 24 hours)
            │
            └── Form shows all out windows for that day (times pre-filled)
                    │
                    ├── 10:30 – 11:45 : [ Meeting with MoF     ]
                    └── 14:00 – 15:30 : [ _____________________ ]
                            │
                            └── Staff fills remarks and submits
                                    ├── on_duty_remarks.remarks saved
                                    ├── on_duty_remarks.submitted_at = now
                                    └── attendance_logs.remarks updated
                                            └── Visible on public board and report
```

---

## 6. Public Display Board Flow

```
Screen outside office refreshes every 60 seconds
    │
    ├── Holiday today?
    │       └── YES → show holiday name or "Office Closed". Stop.
    │
    └── Not a holiday → fetch live data grouped by department
            │
            └── Shows per employee
                    ├── Sl.No
                    ├── Name
                    ├── Status
                    └── Remarks

    Status colour coding
            ├── Present   → Green
            ├── Absent    → Red
            ├── Out       → Amber
            ├── On Duty   → Amber
            └── On Leave  → Red
```

---

## 7. Status Reference

| Situation                                 | Status   | Remarks on Board                       |
| ----------------------------------------- | -------- | -------------------------------------- |
| Recurring weekly holiday (e.g. Sunday)    | Holiday  | Office Closed                          |
| Specific date holiday (e.g. National Day) | Holiday  | National Day                           |
| Day started, no scan yet                  | Out      | blank                                  |
| Checked in (1st scan)                     | Present  | blank                                  |
| No scan by cutoff time                    | Absent   | blank                                  |
| 2nd scan — official work                  | On Duty  | blank until email form filled          |
| Email form submitted                      | On Duty  | 10:30 – 11:45 : Meeting with MoF       |
| Outing applied, will resume               | Out      | Will be back to office from HH:MM      |
| Outing applied, no resume                 | Out      | blank                                  |
| On approved leave                         | On Leave | Will be back to office from DD/MM/YYYY |

---

## 8. Daily Report Structure (per employee)

```
Employee   : Karma Wangchuk  (E001)
Department : Finance
Date       : 17 April 2025

Timeline
────────────────────────────────────────────
09:00       Check-in
10:30       Out (On Duty)
11:45       Returned
14:00       Out (On Duty)
15:30       Returned
17:00       Check-out

Hours Present  : 6h 45m
Hours Out      : 1h 15m

Remarks
────────────────────────────────────────────
10:30 – 11:45  Meeting with MoF
14:00 – 15:30  Site visit Babesa
```

---

## 9. Monthly Report Summary (per employee)

| Field                 | Description                         |
| --------------------- | ----------------------------------- |
| Total days present    | Days with at least one check-in     |
| Total days absent     | Days with no scan and no leave      |
| Total days on leave   | Days covered by approved leave      |
| Total working hours   | Sum of all daily present hours      |
| Average arrival time  | Average of all first check-in times |
| Total on-duty outings | Count of on-duty scan pairs         |

---

## 10. Database Schema (ERD — DBML)

> Paste the block below into **dbdiagram.io** to render the full ERD.

```dbml
// ============================================================
// Dzongkhag Administration — Attendance System (Multi-Office)
// ============================================================

Table admins {
  id            uuid        [pk]
  office_id     uuid        [note: 'NULL for super_admin (global). Required for admin (office-scoped).']
  name          varchar(200)[not null]
  email         varchar(200)[not null, unique, note: 'Login email']
  password_hash varchar(255)[not null, note: 'Bcrypt hashed password']
  role          varchar(20) [not null, note: 'super_admin | admin']
  is_active     boolean     [not null, default: true]
  last_login_at timestamptz [note: 'Updated on each successful login']
  created_by    uuid        [note: 'admins.id of super_admin who created this admin. Null for the first super_admin.']
  created_at    timestamptz [not null, default: `now()`]
  updated_at    timestamptz [not null, default: `now()`]

  indexes {
    email [unique, name: 'uq_admin_email']
    (office_id, role) [name: 'idx_admin_office_role']
  }

  Note: 'Stores both super_admin and admin accounts. Super admins have office_id = NULL and can manage all offices. Admins have a specific office_id and can only manage their own office. Completely separate from the staff table.'
}

Table offices {
  id                   uuid        [pk]
  name                 varchar(200)[not null, unique]
  dzongkhag_code       varchar(20) [not null, unique, note: 'e.g. THIM, PARO, PUNK']
  address              text
  email_domain         varchar(100)[note: 'Used to send remarks URL email to staff']
  office_start_time    time        [not null, default: '09:00']
  office_end_time      time        [not null, default: '17:00']
  absence_cutoff_time  time        [not null, default: '10:00', note: 'Admin-editable. Staff still = out after this time are marked absent.']
  board_refresh_seconds int        [not null, default: 60, note: 'How often the public display board auto-refreshes.']
  is_active            boolean     [not null, default: true]
  created_by           uuid        [not null, note: 'admins.id of super_admin who created this office']
  created_at           timestamptz [not null, default: `now()`]
  updated_at           timestamptz [not null, default: `now()`]

  Note: 'Created and managed by Super Admin. Admin can edit absence_cutoff_time, office_start_time, office_end_time and board_refresh_seconds for their own office only.'
}

Table departments {
  id            uuid        [pk]
  office_id     uuid        [not null]
  name          varchar(150)[not null]
  code          varchar(20) [not null, note: 'Unique per office']
  head_staff_id uuid        [note: 'Head of Department — nullable']
  is_active     boolean     [not null, default: true]
  created_at    timestamptz [not null, default: `now()`]

  indexes {
    (office_id, code) [unique, name: 'uq_dept_code_per_office']
  }
}

Table staff {
  id               uuid        [pk]
  office_id        uuid        [not null]
  department_id    uuid        [not null]
  employee_id      varchar(50) [not null, unique, note: 'Official government employee ID']
  name             varchar(200)[not null]
  contact_no       varchar(20) [not null]
  email            varchar(200)[unique, note: 'Nullable. Required for portal login and on-duty email remarks.']
  password_hash    varchar(255)[note: 'Nullable. Set when staff is given portal access.']
  last_login_at    timestamptz [note: 'Updated on each successful portal login.']
  designation      varchar(150)
  employment_type  varchar(30) [not null, default: 'regular', note: 'regular | contract | deputation']
  milvus_vector_id varchar(100)[unique, note: 'Links to face embedding in Milvus. Null until face enrolled.']
  is_active        boolean     [not null, default: true]
  created_at       timestamptz [not null, default: `now()`]
  updated_at       timestamptz [not null, default: `now()`]

  Note: 'Employees only. No role field — all records here are employees. Admins and super admins are in the admins table.'
}

Table attendance_logs {
  id               uuid        [pk]
  staff_id         uuid        [not null]
  log_date         date        [not null]
  checkin_time     time        [note: 'First check-in of the day']
  checkout_time    time        [note: 'Last checkout of the day']
  status           varchar(30) [not null, default: 'out', note: 'present | out | on_duty | on_leave | absent | holiday']
  remarks          text        [note: 'Displayed on public board']
  checkin_source   varchar(30) [default: 'biometric', note: 'biometric | manual_admin | system_auto']
  checkout_source  varchar(30) [note: 'biometric | manual_admin | system_auto']
  override_by      uuid        [note: 'admins.id who last edited this record']
  created_at       timestamptz [not null, default: `now()`]
  updated_at       timestamptz [not null, default: `now()`]

  indexes {
    (staff_id, log_date) [unique, name: 'uq_staff_log_date']
    log_date             [name: 'idx_log_date']
    status               [name: 'idx_status']
  }
}

Table scan_logs {
  id          uuid        [pk]
  staff_id    uuid        [not null]
  log_date    date        [not null]
  scanned_at  timestamptz [not null]
  scan_type   varchar(20) [not null, note: 'checkin | on_duty']
  source      varchar(30) [not null, default: 'biometric', note: 'biometric | manual_admin']
  created_at  timestamptz [not null, default: `now()`]

  indexes {
    (staff_id, log_date) [name: 'idx_scan_staff_date']
  }
}

Table on_duty_remarks {
  id               uuid        [pk]
  staff_id         uuid        [not null]
  log_date         date        [not null]
  out_scan_id      uuid        [not null]
  in_scan_id       uuid
  out_time         time        [not null]
  in_time          time
  remarks          text
  token            varchar(200)[not null, unique]
  token_expires_at timestamptz [not null]
  submitted_at     timestamptz
  created_at       timestamptz [not null, default: `now()`]

  indexes {
    (staff_id, log_date) [name: 'idx_duty_remarks_staff_date']
  }
}

Table outing_requests {
  id                    uuid        [pk]
  staff_id              uuid        [not null]
  log_date              date        [not null]
  requested_at          timestamptz [not null, default: `now()`]
  will_resume           boolean     [not null]
  resume_time           time
  outing_before_checkin boolean     [not null, default: false]
  status                varchar(20) [not null, default: 'active', note: 'active | resumed | cancelled']
  resumed_at            timestamptz
  created_at            timestamptz [not null, default: `now()`]
  updated_at            timestamptz [not null, default: `now()`]

  indexes {
    (staff_id, log_date) [name: 'idx_outing_staff_date']
  }
}

Table leave_requests {
  id           uuid        [pk]
  staff_id     uuid        [not null]
  leave_from   date        [not null]
  leave_to     date        [not null]
  leave_type   varchar(50) [not null, note: 'casual | earned | medical | maternity | special']
  reason       text
  status       varchar(20) [not null, default: 'approved', note: 'approved | cancelled']
  cancelled_at timestamptz
  created_at   timestamptz [not null, default: `now()`]

  indexes {
    (staff_id, leave_from, leave_to) [name: 'idx_leave_staff_dates']
  }
}

Table weekly_holidays {
  id           uuid     [pk]
  office_id    uuid     [not null]
  day_of_week  smallint [not null, note: '0 = Sunday … 6 = Saturday']
  is_active    boolean  [not null, default: true]
  created_by   uuid     [not null, note: 'admins.id who marked this day']
  created_at   timestamptz [not null, default: `now()`]

  indexes {
    (office_id, day_of_week) [unique, name: 'uq_weekly_holiday_per_office']
  }
}

Table holidays {
  id           uuid        [pk]
  office_id    uuid        [not null]
  holiday_date date        [not null]
  name         varchar(200)[not null]
  type         varchar(30) [not null, default: 'public', note: 'public | restricted']
  created_by   uuid        [not null, note: 'admins.id who added this holiday']
  created_at   timestamptz [not null, default: `now()`]

  indexes {
    (office_id, holiday_date) [unique, name: 'uq_holiday_per_office']
  }
}

Table admin_overrides {
  id             uuid        [pk]
  admin_id       uuid        [not null, note: 'admins.id who made the change']
  target_table   varchar(50) [not null, note: 'attendance_logs | leave_requests | outing_requests | holidays | weekly_holidays | offices | staff']
  target_id      uuid        [not null, note: 'PK of the row that was changed']
  action_type    varchar(50) [not null, note: 'manual_checkin | manual_checkout | change_status | edit_remarks | edit_cutoff_time | edit_holiday | deactivate_staff | create_admin | deactivate_admin']
  old_value      text        [note: 'Snapshot before change (JSON or plain text)']
  new_value      text        [note: 'Snapshot after change (JSON or plain text)']
  reason         text        [not null, note: 'Mandatory — admin must explain every edit']
  override_at    timestamptz [not null, default: `now()`]

  indexes {
    (target_table, target_id) [name: 'idx_override_target']
    admin_id                  [name: 'idx_override_admin']
  }

  Note: 'Append-only audit log covering all admin/super_admin actions. Never delete from this table.'
}

Table system_settings {
  id          uuid        [pk]
  key         varchar(100)[not null, unique, note: 'Global-only settings e.g. milvus_threshold']
  value       varchar(500)[not null]
  description text
  updated_by  uuid        [note: 'admins.id of super_admin who changed this']
  updated_at  timestamptz [not null, default: `now()`]

  Note: 'Global-only technical settings managed by Super Admin. Office-level settings (cutoff time, hours, board refresh) are columns on the offices table.'
}

// ============================================================
// Relationships
// ============================================================

Ref: admins.office_id             > offices.id
Ref: admins.created_by            > admins.id

Ref: offices.created_by           > admins.id

Ref: departments.office_id        > offices.id
Ref: departments.head_staff_id    > staff.id

Ref: staff.office_id              > offices.id
Ref: staff.department_id          > departments.id

Ref: attendance_logs.staff_id     > staff.id
Ref: attendance_logs.override_by  > admins.id

Ref: scan_logs.staff_id           > staff.id

Ref: on_duty_remarks.staff_id     > staff.id
Ref: on_duty_remarks.out_scan_id  > scan_logs.id
Ref: on_duty_remarks.in_scan_id   > scan_logs.id

Ref: outing_requests.staff_id     > staff.id

Ref: leave_requests.staff_id      > staff.id

Ref: weekly_holidays.office_id    > offices.id
Ref: weekly_holidays.created_by   > admins.id

Ref: holidays.office_id           > offices.id
Ref: holidays.created_by          > admins.id

Ref: admin_overrides.admin_id     > admins.id

Ref: system_settings.updated_by   > admins.id
```

---

## 11. Table Summary

| Table             | Who owns it    | Purpose                                                                                   |
| ----------------- | -------------- | ----------------------------------------------------------------------------------------- |
| `admins`          | Super Admin    | All `super_admin` and `admin` accounts. Email + password login. Office-scoped for admins. |
| `offices`         | Super Admin    | One row per Dzongkhag office. Holds cutoff time, office hours, board refresh rate.        |
| `departments`     | Admin          | Departments within each office.                                                           |
| `staff`           | Admin          | Employees only. No role field. Auth fields for portal login.                              |
| `attendance_logs` | System / Admin | One row per staff per day. Source of truth for public board.                              |
| `scan_logs`       | System         | Every individual face scan event. Drives daily report timeline.                           |
| `on_duty_remarks` | System / Staff | One row per out-in scan pair. Staff fills via email URL.                                  |
| `outing_requests` | Staff          | Employee-submitted outings with resume preference.                                        |
| `leave_requests`  | Staff          | Employee-submitted leaves. Auto-approved instantly.                                       |
| `weekly_holidays` | Admin          | Recurring weekly holidays per office (e.g. every Sunday).                                 |
| `holidays`        | Admin          | One-time specific date holidays per office.                                               |
| `admin_overrides` | System         | Generic append-only audit trail of all admin/super_admin actions.                         |
| `system_settings` | Super Admin    | Global-only technical config (e.g. Milvus threshold). Office settings live in `offices`.  |

---

_System: Dzongkhag Administration Attendance System_
_Office hours: 09:00 – 17:00 | Absence cutoff: configurable per office (default 10:00 AM)_
_Version: 3 | Face recognition: InsightFace + Milvus_
