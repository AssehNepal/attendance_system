This guide provides a focused technical specification for integrating Bhutan NDI with your backend. It is designed to be read by an AI to understand the architectural flow, environmental requirements, and data structures needed for a successful NATS-based implementation.

---

# Bhutan NDI Backend Integration Specification (NATS Flow)

## 1. Environment Configuration (`.env`)

The backend must store the following sensitive credentials in the environment configuration:

| Variable           | Description                              |
| ------------------ | ---------------------------------------- |
| `NDI_AUTH_URL`     | Endpoint for OAuth 2.0 token generation. |
| `NDI_VERIFIER_URL` | Endpoint for creating Proof Requests.    |
| `NDI_CLIENT_ID`    | Assigned Client ID for the application.  |

|
| `NDI_CLIENT_SECRET` | Assigned Client Secret for the application.

|
| `NDI_GRANT_TYPE` | Set to `client_credentials`.

|
| `NDI_NATS_SEED` | The private NKey seed for NATS authentication.

|
| `NDI_NATS_URL` | <br>`https://natsdemoclient.bhutanndi.com`.

|

---

## 2. Integration Workflow

### Phase A: Authentication & Initialization

1.  **Token Retrieval**: The backend must first authenticate with the `NDI_AUTH_URL` using `client_id` and `client_secret` to obtain a JWT access token.

2.  **Request Header**: All subsequent API calls to NDI services must include `Authorization: Bearer <ACCESS_TOKEN>`.

### Phase B: Proof Request (The "Button Click")

When a user initiates a login/verification action:

1.  **Generate Request**: Call the `POST /verifier/v1/proof-request` endpoint.

2.  **Define Attributes**: The request body must contain `proofAttributes` specifying the data needed (e.g., "ID Number", "Full Name").

3.  **Process Response**: Extract the following from the response:

- **`proofRequestURL`**: To be converted into a QR Code for the user to scan.

- **`deepLinkURL`**: To be displayed as a clickable link for mobile users.

- **`proofRequestThreadId`**: The unique identifier for this specific transaction.

### Phase C: Asynchronous Response Handling (NATS)

Instead of a webhook, the system will use NATS to receive the user's data:

1.  **Connection**: Establish a secure connection to the NDI NATS server using the `seed` and `nkeyAuthenticator`.

2.  **Subscription**: Immediately subscribe to a NATS "subject" using the `proofRequestThreadId` as the pattern.

3.  **Awaiting Data**: The backend stays in a listening state for this specific thread.
4.  **Logging**: Upon receipt of the message (once the user approves in the NDI app), the backend must extract the payload and log the results to the terminal.

---

## 3. Data Formats

### Proof Request Input (POST)

**Endpoint**: `/verifier/v1/proof-request`

```json
{
  "proofName": "Verify Foundational ID",
  "proofAttributes": [
    {
      "name": "ID Number",
      "restrictions": [{ "schema_name": "<SCHEMA_URL>" }]
    },
    {
      "name": "Full Name",
      "restrictions": [{ "schema_name": "<SCHEMA_URL>" }]
    }
  ]
}
```

### Proof Request Output (Response)

```json
{
  "data": {
    "proofRequestThreadId": "d5356253-9798-4082-a46d-8358a2bb173d",
    "deepLinkURL": "bhutanndidemo://data?url=...",
    "proofRequestURL": "https://..."
  }
}
```

### NATS Presentation Result (The Final Response)

The message received over NATS will follow this structure:

```json
{
  "type": "present-proof/presentation-result",
  "verification_result": "ProofValidated",
  "revealed_attrs": {
    "ID Number": [{ "value": "1234" }],
    "Full Name": [{ "value": "demo name" }]
  },
  "relationship_did": "...",
  "thid": "99ed65da-ff61-48d9-a7fe-f25cc54e3ec0"
}
```

---

## 4. Key Security Notes for AI

- **Case Sensitivity**: Attribute names (e.g., "Full Name") are case-sensitive; they must match the NDI Schema exactly.

- **Relationship Management**: For returning users, use the `relationship_did` to identify the same wallet across different sessions.

- **Asynchronous Nature**: The backend must be designed to handle a significant delay between providing the QR code and receiving the NATS message, as it depends on user physical action.
