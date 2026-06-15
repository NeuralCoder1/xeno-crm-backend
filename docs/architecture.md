# AI-Native CRM Backend Architecture

## Scope

This backend is the CRM system of record for customers, orders, audience segments, marketing campaigns, outbound communication tracking, callback ingestion, and analytics aggregation.

The channel service is a separate system. This backend does not send email, SMS, WhatsApp, push, or RCS messages directly. It creates dispatch requests, stores campaign and communication state, and receives callback events from the channel service.

Frontend implementation is intentionally out of scope.

## Technology Stack

- Runtime: Node.js
- HTTP framework: Express
- Database: MongoDB
- ODM: Mongoose
- Architecture style: Clean MVC with service layer

## Project Structure

```text
backend/
  src/
    config/
      Environment, database, logger, and external service configuration.
    controllers/
      Express request handlers. Validate request context, call services, return HTTP responses.
    middleware/
      Cross-cutting Express middleware such as authentication, validation, errors, rate limits, and request IDs.
    models/
      Mongoose schemas and model exports for persisted domain entities.
    routes/
      Express routers grouped by resource and mounted under versioned API paths.
    services/
      Business logic, orchestration, channel-service integration, segmentation, and analytics behavior.
      AI service and copilot orchestration (AIService)
    utils/
      Shared helpers for pagination, errors, date ranges, idempotency, and response formatting.
docs/
  api-contracts.md
  architecture.md
  database-design.md
```

## Core Domain Modules

### Customer Module

Owns customer profile data, consent metadata, customer attributes, lifecycle status, and references to orders. Customers are the primary audience entity used by segments and campaigns.

Responsibilities:

- Create and update customer profiles.
- Store marketer-defined customer attributes.
- Support searchable/filterable customer lists.
- Preserve consent and opt-out state for campaign eligibility.

### Order Module

Owns purchase transactions linked to customers. Orders power segmentation and analytics.

Responsibilities:

- Store order totals, status, timestamps, and item details.
- Support customer purchase history.
- Provide aggregate inputs for segment rules such as total spend, order count, and last purchase date.

### Segment Module

Owns reusable audience definitions. A segment stores rules, not copied customer lists, unless a campaign snapshot is generated at launch time.

Responsibilities:

- Store marketer-defined audience rules.
- Estimate matching audience size.
- Resolve eligible customers for campaign launch.
- Version segment definitions so campaign launches can be audited.

### Campaign Module

Owns marketing campaign metadata, targeting, lifecycle, dispatch state, and aggregate performance.

Responsibilities:

- Create campaign drafts.
- Select a segment and channel.
- Launch campaigns by creating communication logs and dispatch requests to the channel service.
- Track campaign status from draft through completion.
- Store aggregate analytics counters.

### Communication Log Module

Owns per-recipient communication state. This is the audit trail for every attempted campaign delivery.

Responsibilities:

- Track one outbound message per customer per campaign channel attempt.
- Store channel-service message IDs.
- Process callback events idempotently.
- Power analytics such as sent, delivered, opened, clicked, bounced, failed, and conversion counts.

## Runtime Request Flow

### Customer And Order Ingestion

1. Client calls CRM API to create or update customers and orders.
2. Route forwards the request to the controller.
3. Controller delegates business rules to the service.
4. Service validates domain constraints and writes through Mongoose models.
5. Controller returns a consistent API response.

### Segment Evaluation

1. Client creates or updates a segment rule definition.
2. Segment service validates supported operators and rule shape.
3. For previews, the service compiles rules into MongoDB queries and returns an estimated count.
4. For campaign launch, the campaign service resolves the segment into a recipient snapshot.

### Campaign Launch

1. Client launches a draft campaign.
2. Campaign service loads the campaign and segment.
3. Segment service resolves eligible customers while enforcing consent and suppression rules.
4. Communication logs are created with `queued` status.
5. Channel client service sends a dispatch request to the separate channel service.
6. Campaign status changes to `scheduled`, `running`, or `completed` depending on dispatch strategy.

### Callback Processing

1. Channel service sends delivery events to the callback endpoint.
2. Middleware authenticates the callback signature or shared secret.
3. Communication log service applies the event idempotently.
4. Campaign aggregate counters are updated.
5. The endpoint returns success for duplicate already-processed events.

### AI Copilot Flow

1. A user or marketer invokes the AI Copilot via the frontend or an API request.
2. The Copilot UI sends a high-level goal to the backend AI endpoints (e.g. `/api/v1/ai/copilot`).
3. The backend `AIService` orchestrates calls to an LLM or AI model and performs:
  - `generateSegment()` to produce segment rules or a candidate segment.
  - `generateMessage()` to draft message content tailored to the campaign goal.
  - `recommendChannel()` to select the preferred channel(s) based on customer data, campaign type, and historical performance.
4. The `AIService` returns proposed artifacts to the Copilot UI and persists an `AISession` for auditability.
5. The user reviews and optionally edits the generated segment and message, then confirms campaign creation.
6. The `CampaignService` creates a draft campaign (with the generated segment/message) and proceeds with normal launch orchestration.

AI Copilot high-level flow:

User → AI Copilot (frontend) → AI Service (`AIService`) → Segment Generation → Message Generation → Channel Recommendation → Campaign Creation

## API Versioning

All CRM APIs should be mounted under:

```text
/api/v1
```

Callback APIs may share the same version prefix:

```text
/api/v1/callbacks/channel-events
```

Breaking changes should introduce `/api/v2` while keeping `/api/v1` stable for existing clients.

## Service Boundaries

### Internal Services

- `CustomerService`: customer CRUD, search, consent updates.
- `OrderService`: order CRUD, order/customer consistency.
- `SegmentService`: rule validation, query compilation, audience preview, audience resolution.
- `CampaignService`: campaign lifecycle, launch orchestration, status transitions.
- `CommunicationLogService`: per-recipient state, callback event handling, idempotency.
- `AnalyticsService`: campaign and audience performance summaries.
- `ChannelServiceClient`: outbound HTTP client for the separate channel service.
- `AIService`: orchestration and integration with AI models, responsible for generating segments and messages, recommending channels, and providing a copilot workflow for campaign creation.

### External Channel Service Contract

The CRM backend sends dispatch requests to the channel service and receives asynchronous callbacks. The channel service owns provider-specific integrations. The CRM owns campaign intent, recipient selection, and analytics state.

Recommended outbound request fields:

- `campaignId`
- `communicationLogId`
- `customerId`
- `channel`
- `recipient`
- `template`
- `payload`
- `callbackUrl`

Recommended callback fields:

- `eventId`
- `messageId`
- `communicationLogId`
- `campaignId`
- `customerId`
- `eventType`
- `eventTimestamp`
- `metadata`

## Cross-Cutting Backend Concerns

### Authentication And Authorization

Production APIs should require authentication for marketer-facing endpoints. Role-based access should separate admins, campaign managers, analysts, and integration clients.

Callback endpoints should use a dedicated authentication mechanism such as HMAC signature validation, mTLS, or a rotated shared secret. Callback authentication should not depend on user sessions.

### Validation

Request validation should happen before controller logic using middleware or schema validators. Domain validation should remain in services so it is enforced consistently across API and background workflows.

### Error Handling

Controllers should not format errors manually. They should throw typed application errors and let centralized error middleware convert them into consistent API responses.

Recommended error shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Segment rules are invalid.",
    "details": []
  },
  "requestId": "req_123"
}
```

### Idempotency

Campaign launch and callback ingestion must be idempotent.

- Campaign launch should reject duplicate launch requests for already launched campaigns or require an `Idempotency-Key`.
- Callback processing should store external `eventId` values and ignore duplicates.
- Communication logs should enforce uniqueness for campaign/customer/channel attempts.

### Analytics Strategy

Communication logs are the source of truth for message-level events. Campaign documents may store denormalized counters for fast dashboard reads.

Counters should be updated by service logic after callback persistence. For high volume, this should move to asynchronous processing with a queue, but the domain contract remains unchanged.

### Observability

Production readiness should include:

- Request ID propagation.
- Structured logs.
- Error logs with stack traces outside API responses.
- Metrics for campaign launch volume, callback latency, callback failures, and channel-service errors.
- Health endpoint for database connectivity.

### Security

Sensitive fields such as callback secrets, provider credentials, and database URLs must come from environment variables. Customer PII should be minimized in logs. APIs returning customer data should support field-level redaction if needed.

## Recommended Backend Files To Add During Implementation

These files are intentionally not generated yet because this phase is architecture and documentation only.

```text
backend/src/config/database.js
backend/src/config/env.js
backend/src/config/logger.js
backend/src/models/Customer.js
backend/src/models/Order.js
backend/src/models/Segment.js
backend/src/models/Campaign.js
backend/src/models/CommunicationLog.js
backend/src/routes/*.routes.js
backend/src/controllers/*.controller.js
backend/src/services/*.service.js
backend/src/middleware/error.middleware.js
backend/src/middleware/validate.middleware.js
backend/src/utils/*.js
backend/src/models/AISession.js
backend/src/services/AIService.js
```
