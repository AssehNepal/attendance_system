# NATS JetStream Setup Guide for Office Location Sync

## Overview

This setup enables real-time synchronization of office locations between:

- **auth_service** (Publisher) - Creates/Updates/Deletes office locations
- **common_service** (Subscriber) - Listens and syncs office location data

## Architecture Flow

```
┌─────────────────┐         NATS JetStream          ┌──────────────────┐
│   Auth Service  │────────────────────────────────▶│  Common Service  │
│   (Publisher)   │  office_location.created        │   (Subscriber)   │
│                 │  office_location.updated        │                  │
│                 │  office_location.deleted        │                  │
└─────────────────┘                                 └──────────────────┘
```

## Prerequisites

### 1. Install NATS Server

**macOS (using Homebrew):**
\`\`\`bash
brew install nats-server
\`\`\`

**Or using Docker:**
\`\`\`bash
docker run -d --name nats -p 4222:4222 -p 8222:8222 nats:latest -js
\`\`\`

### 2. Start NATS Server

**Using Homebrew:**
\`\`\`bash
nats-server -js
\`\`\`

**Using Docker:**
\`\`\`bash
docker start nats
\`\`\`

The server will run on:

- Client connections: `localhost:4222`
- HTTP monitoring: `localhost:8222`

## Installation Steps

### Step 1: Install Required Packages

**In auth_service:**
\`\`\`bash
cd /Users/assehnepal/Desktop/Census/census-backend/auth_service
yarn add @nestjs/microservices nats
\`\`\`

**In common_service (already done):**
\`\`\`bash
cd /Users/assehnepal/Desktop/Census/census-backend/common_service
yarn add @nestjs/microservices nats
\`\`\`

### Step 2: Environment Configuration

**Add to auth_service/.env:**
\`\`\`bash

# NATS Configuration

NATS_URL=nats://localhost:4222
\`\`\`

**Add to common_service/.env:**
\`\`\`bash

# NATS Configuration

NATS_ENABLED=true
NATS_HOST=localhost
NATS_PORT=4222
\`\`\`

### Step 3: Update ApiConfigService (Common Service)

Add NATS configuration to \`common_service/src/shared/services/api-config.service.ts\`:

\`\`\`typescript
get natsEnabled(): boolean {
return this.getBoolean('NATS_ENABLED');
}

get natsConfig() {
return {
host: this.getString('NATS_HOST'),
port: this.getNumber('NATS_PORT'),
};
}
\`\`\`

## Files Created

### Auth Service (Publisher)

1. **Events:**

   - \`src/modules/office-location/events/office-location-created.event.ts\`
   - \`src/modules/office-location/events/office-location-updated.event.ts\`
   - \`src/modules/office-location/events/office-location-deleted.event.ts\`
   - \`src/modules/office-location/events/index.ts\`

2. **Constants:**

   - \`src/constants/nats-patterns.ts\`

3. **Updated Files:**
   - \`src/modules/office-location/office-location.service.ts\` - Emits events
   - \`src/modules/office-location/office-location.module.ts\` - Registers NATS client

### Common Service (Subscriber)

1. **Events:**

   - \`src/events/office-location-created.event.ts\`
   - \`src/events/office-location-updated.event.ts\`
   - \`src/events/office-location-deleted.event.ts\`
   - \`src/events/index.ts\`

2. **Constants:**

   - \`src/constants/nats-patterns.ts\`

3. **Module:**

   - \`src/modules/office-location/entities/office-location.entity.ts\`
   - \`src/modules/office-location/office-location.service.ts\` - Handles events
   - \`src/modules/office-location/office-location.controller.ts\` - Event listeners
   - \`src/modules/office-location/office-location.module.ts\`

4. **Updated Files:**
   - \`src/app.module.ts\` - Added OfficeLocationModule

## Event Patterns

| Event Name | Pattern                     | Payload                                |
| ---------- | --------------------------- | -------------------------------------- |
| Created    | \`office_location.created\` | \`{ id, name, createdAt, updatedAt }\` |
| Updated    | \`office_location.updated\` | \`{ id, name, updatedAt }\`            |
| Deleted    | \`office_location.deleted\` | \`{ id, deletedAt }\`                  |

## How It Works

### 1. Create Office Location (Auth Service)

When you create an office location via POST \`/office-location\`:

1. Auth service saves to its database
2. Emits \`office_location.created\` event to NATS
3. Common service receives event
4. Common service saves office location to its database

### 2. Update Office Location (Auth Service)

When you update via PATCH \`/office-location/:id\`:

1. Auth service updates its database
2. Emits \`office_location.updated\` event to NATS
3. Common service receives event
4. Common service updates the corresponding record

### 3. Delete Office Location (Auth Service)

When you delete via DELETE \`/office-location/:id\`:

1. Auth service removes from its database
2. Emits \`office_location.deleted\` event to NATS
3. Common service receives event
4. Common service deletes the corresponding record

## Testing the Setup

### 1. Start NATS Server

\`\`\`bash
nats-server -js
\`\`\`

### 2. Start Common Service

\`\`\`bash
cd common_service
yarn start:dev
\`\`\`

You should see in logs:
\`\`\`
[Nest] Mapped {office_location.created, NATS} route
[Nest] Mapped {office_location.updated, NATS} route
[Nest] Mapped {office_location.deleted, NATS} route
\`\`\`

### 3. Start Auth Service

\`\`\`bash
cd auth_service
yarn start:dev
\`\`\`

### 4. Test Create

\`\`\`bash
curl -X POST http://localhost:5001/office-location \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_TOKEN" \\
-d '{"name": "Thimphu Office"}'
\`\`\`

**Expected Logs:**

- **Auth Service:** Office location created
- **Common Service:** \`Received office location created event: <uuid>\`
- **Common Service:** \`Office location <uuid> created successfully\`

### 5. Test Update

\`\`\`bash
curl -X PATCH http://localhost:5001/office-location/<uuid> \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_TOKEN" \\
-d '{"name": "Thimphu Main Office"}'
\`\`\`

**Expected Logs:**

- **Common Service:** \`Received office location updated event: <uuid>\`
- **Common Service:** \`Office location <uuid> updated successfully\`

### 6. Test Delete

\`\`\`bash
curl -X DELETE http://localhost:5001/office-location/<uuid> \\
-H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

**Expected Logs:**

- **Common Service:** \`Received office location deleted event: <uuid>\`
- **Common Service:** \`Office location <uuid> deleted successfully\`

## Monitoring NATS

### Monitor NATS Server

\`\`\`bash

# Show server info

curl http://localhost:8222/varz

# Show connections

curl http://localhost:8222/connz

# Show subscriptions

curl http://localhost:8222/subsz
\`\`\`

### Using NATS CLI (Optional)

\`\`\`bash

# Install

brew install nats-io/nats-tools/nats

# Subscribe to events (for debugging)

nats sub "office_location.\*"
\`\`\`

## Database Migration for Common Service

Create migration for office_locations table:

\`\`\`bash
cd common_service
yarn migration:generate src/database/migrations/CreateOfficeLocation
\`\`\`

Then run:
\`\`\`bash
yarn migration:run
\`\`\`

## Troubleshooting

### Issue: "Cannot connect to NATS"

**Solution:** Ensure NATS server is running:
\`\`\`bash
nats-server -js
\`\`\`

### Issue: "Events not received in common_service"

**Solution:**

1. Check NATS_ENABLED=true in common_service/.env
2. Verify common_service logs show microservice started
3. Check both services are connecting to same NATS server

### Issue: "Duplicate office locations"

**Solution:** The service has idempotency checks. If duplicates occur, check database constraints.

## Next Steps

1. **Install NATS packages in auth_service**
2. **Add NATS_URL to auth_service/.env**
3. **Add NATS configuration to common_service ApiConfigService**
4. **Start NATS server**
5. **Run database migration in common_service**
6. **Test the complete flow**

## Production Considerations

1. **NATS Clustering:** Use multiple NATS servers for high availability
2. **JetStream:** Enable persistence for guaranteed message delivery
3. **Error Handling:** Implement dead letter queues
4. **Monitoring:** Set up alerts for NATS connection failures
5. **Authentication:** Enable NATS authentication in production

## Additional Resources

- [NATS Documentation](https://docs.nats.io/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [NATS JetStream](https://docs.nats.io/nats-concepts/jetstream)
