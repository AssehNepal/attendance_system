# NATS Integration Reference Guide

This document details the NATS implementation used for the NDI Authentication Service. It covers the **External NDI Connection** (secure, authenticated) and the **Internal Broadcast System** (inter-service communication).

## 1. Architecture Overview

The service utilizes **two separate**s NATS connections serving distinct purposes:

1.  **External NDI NATS**:

    - **Role**: Client.
    - **Purpose**: Listens for secure verification updates from the Bhutan NDI platform.
    - **Auth**: NKEY (Seed-based authentication).
    - **Pattern**: Ephemeral subscriptions (Subscribe -> Wait for specific message -> Unsubscribe).

2.  **Internal NATS**:
    - **Role**: Peer / Broadcaster.
    - **Purpose**: Syncs verification state across multiple backend pods/instances.
    - **Auth**: Basic / None (Internal network).
    - **Pattern**: Pub-Sub (Broadcast result to all listeners).

---

## 2. Implementation Details

### A. Dependencies

Ensure you have the official NATS client installed:

```bash
npm install nats
```

### B. Connection Setup

#### 1. External Connection (NKEY Authentication)

The NDI connection relies on `nkeyAuthenticator`. This method uses a private seed (starting with `S...`) to sign a nonce challenge provided by the server, ensuring secure authentication without sending the private key over the wire.

```typescript
import { connect, NatsConnection, nkeyAuthenticator } from 'nats';

// ... inside your service class

private ndiNats!: NatsConnection;

async connectToNdiNats() {
  const natsUrl = process.env.BHUTAN_NDI_NATS_URL; // e.g., wss://natsdemoclient.bhutanndi.com
  const authenticatorSeed = process.env.BHUTAN_NDI_AUTHENTICATOR_SEED; // Starts with 'S'

  try {
    this.ndiNats = await connect({
      servers: [natsUrl],
      // NKEY Authentication: Signs the nonce provided by the server
      authenticator: nkeyAuthenticator(
        new TextEncoder().encode(authenticatorSeed),
      ),
      name: 'my-service-client', // Client name visible in NATS logs
    });

    console.log('Connected to NDI NATS');

    // Handle connection closure
    this.ndiNats.closed().then((err) => {
      if (err) console.error(`Connection closed: ${err.message}`);
    });

  } catch (error) {
    console.error('Failed to connect', error);
  }
}
```

---

### C. Message Handling (Async Iterator Pattern)

The `nats.js` library uses **Async Iterators** for subscriptions. This modern approach avoids "callback hell" and allows you to process messages in a simple loop.

#### 1. String Codec

NATS messages are transmitted as binary `Uint8Array`. A `StringCodec` is required to encode/decode them.

```typescript
import { StringCodec } from 'nats';

private readonly sc = StringCodec();
```

#### 2. Subscribing & Listening (Ephemeral)

This pattern is used for **temporary** listeners, such as waiting for a specific user to login. The loop runs until the transaction is complete, then terminates.

```typescript
private async subscribeToThread(threadId: string) {
  // 1. Create Subscription on the specific Topic (Thread ID)
  const subscription = this.ndiNats.subscribe(threadId);

  // 2. Process messages as they arrive
  (async () => {
    try {
      for await (const msg of subscription) {
        // 3. Decode message
        const messageString = this.sc.decode(msg.data);
        const parsed = JSON.parse(messageString);
        // Handle potential data wrapping (standard vs envelope)
        const data = parsed.data ?? parsed;

        console.log(`Received Event: ${data.type} for ${threadId}`);

        // 4. Check for terminal states (Success or Failure)
        if (
          data.type === 'present-proof/presentation-result' ||
          data.type === 'present-proof/rejected'
        ) {
          this.handleResult(data);

          // 5. Cleanup: Important to stop listening after terminal event
          subscription.unsubscribe();
          break; // Exit the loop
        }
      }
    } catch (err) {
      console.error('Subscription error:', err);
    }
  })();
}
```

---

### D. Data Structure: Verification Result

When NDI sends a successful `present-proof/presentation-result` with `verification_result: 'ProofValidated'`, the payload structure is as follows:

```typescript
if (data.verification_result === 'ProofValidated') {
  // Access the actual credentials inside 'revealed_attrs'
  const attributes = data.requested_presentation.revealed_attrs;

  // Note: Values are returned as arrays, even for single attributes
  const idNumber = attributes['ID Number']?.[0]?.value;
  const fullName = attributes['Full Name']?.[0]?.value;

  console.log(`User Verified: ${fullName} (${idNumber})`);
}
```

---

### E. Internal Broadcasting (Pub/Sub)

This pattern is used to notify **all other running instances** of the application about an event (e.g., "User X has logged in on Pod A, please update Pod B").

#### 1. Publishing (The Sender)

```typescript
private broadcastResult(threadId: string, result: any) {
  if (!this.internalNats) return;

  const channel = 'admin-auth.ndi.verification';
  const payload = JSON.stringify({ threadId, result });

  // Publish encoded string
  this.internalNats.publish(channel, this.sc.encode(payload));
}
```

#### 2. Global Subscription (The Listener)

This is typically initialized in `onModuleInit` and runs for the lifetime of the application.

```typescript
private async subscribeToInternalBroadcast() {
  if (!this.internalNats) return;

  // Subscribe to the shared channel
  const subscription = this.internalNats.subscribe('admin-auth.ndi.verification');

  (async () => {
    // This loop runs forever waiting for messages from peers
    for await (const msg of subscription) {
      const { threadId, result } = JSON.parse(this.sc.decode(msg.data));

      // Update local state based on broadcast
      this.updateLocalState(threadId, result);
    }
  })();
}
```
