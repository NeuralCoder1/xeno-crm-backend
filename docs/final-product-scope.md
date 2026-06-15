# Final Frozen Product Scope

## Product Definition

This product is an AI-native CRM MVP for marketers. It lets a marketer store customers and orders, define audience segments, create campaigns, send campaigns through a separate channel simulator, receive delivery callbacks, and view campaign analytics.

The scope is intentionally constrained for a 2-3 day assignment build. The product should demonstrate sound backend architecture, working end-to-end campaign flow, clear API boundaries, and practical AI-assisted marketer workflows without attempting enterprise-scale CRM breadth.

## 1. Exact Screens

The following screens define the complete MVP user surface. They are listed to freeze product behavior and API needs. This document does not require frontend implementation.

### 1. Dashboard

Purpose:

- Give the marketer a quick view of CRM and campaign performance.

Visible data:

- Total customers.
- Total orders.
- Total segments.
- Total campaigns.
- Recent campaigns with status.
- Aggregate campaign metrics: sent, delivered, failed, opened, clicked.

Primary actions:

- View campaigns.
- Create campaign.
- View customers.
- View segments.

### 2. Customers

Purpose:

- Let the marketer inspect stored customer profiles.

Visible data:

- Customer name.
- Email.
- Phone.
- City.
- Loyalty tier.
- Lifetime value.
- Order count.
- Last order date.
- Consent status.

Filters:

- Search by name, email, or phone.
- Status.
- City.
- Loyalty tier.

Primary actions:

- View customer details.
- Create customer through API or import seed data.
- Update consent/status through API.

### 3. Customer Details

Purpose:

- Show a single customer profile and purchase history.

Visible data:

- Profile details.
- Dynamic attributes.
- Consent by channel.
- Lifetime value.
- Order count.
- Order history.
- Communication history.

Primary actions:

- Update customer profile.
- Update consent.

### 4. Orders

Purpose:

- Let the marketer or evaluator inspect order data used for segmentation.

Visible data:

- Order ID.
- Customer.
- Status.
- Grand total.
- Currency.
- Ordered date.
- Item count.

Filters:

- Customer.
- Status.
- Date range.

Primary actions:

- Create order through API or seed data.
- Update order status through API.

### 5. Segments

Purpose:

- Let the marketer create, preview, and manage audience segments.

Visible data:

- Segment name.
- Description.
- Status.
- Rule summary.
- Estimated audience size.
- Last evaluated date.
- Version.

Primary actions:

- Create segment manually.
- Create segment using AI prompt.
- Preview audience size.
- Edit segment while in draft or active state.
- Archive segment.

### 6. Segment Builder

Purpose:

- Define the exact audience criteria for campaigns.

Supported manual rules:

- Customer city equals one value.
- Customer loyalty tier equals one value.
- Customer lifetime value greater than or equal to a number.
- Customer order count greater than or equal to a number.
- Customer last order date before or after a date.
- Customer consent for selected channel is true.

Supported grouping:

- Single top-level `and` group.
- Optional `or` group is acceptable if time permits, but not required for MVP.

AI behavior:

- Marketer enters a plain-language segment prompt.
- System returns a structured segment rule draft.
- Marketer can preview and save the generated segment.

Example prompt:

```text
Customers in Mumbai with lifetime value above 10000 who have email consent.
```

Expected generated rule:

```text
city = Mumbai AND lifetimeValue >= 10000 AND consent.email = true
```

### 7. Campaigns

Purpose:

- Let the marketer manage marketing campaigns.

Visible data:

- Campaign name.
- Channel.
- Segment.
- Status.
- Audience size.
- Created date.
- Launched date.
- Sent, delivered, failed, opened, clicked.

Filters:

- Status.
- Channel.
- Segment.

Primary actions:

- Create campaign.
- Launch campaign.
- Cancel draft or scheduled campaign.
- View analytics.

### 8. Campaign Builder

Purpose:

- Create a campaign draft ready for launch.

Required fields:

- Campaign name.
- Campaign type.
- Channel.
- Segment.
- Template ID or simple message body.
- Subject for email campaigns.
- Message body.

AI behavior:

- Generate campaign message from campaign goal, selected segment, and channel.
- Suggest a concise subject line for email campaigns.
- Return editable text only. The marketer owns final approval.

Supported channels:
Supported channels:

- Email.
- SMS.
- WhatsApp.
- RCS.

Excluded from MVP:

- Push notifications, unless already trivial from the shared channel abstraction.
- Rich template editors.
- Image generation.

### 9. Campaign Analytics

Purpose:

- Show performance for one launched campaign.

Visible data:

- Campaign status.
- Audience size.
- Queued count.
- Sent count.
- Delivered count.
- Failed count.
- Bounced count.
- Opened count.
- Clicked count.
- Unsubscribed count.
- Converted count.
- Delivery rate.
- Failure rate.
- Open rate.
- Click rate.
- Conversion rate.
- Recent communication events.

AI behavior:

- Generate a short plain-English summary of campaign performance.
- Highlight the strongest and weakest metric.
- Suggest one next action.

### 10. Communication Logs

Purpose:

- Provide auditability for outbound campaign messages.

Visible data:

- Campaign.
- Customer.
- Channel.
- Recipient.
- Status.
- Channel message ID.
- Last event date.
- Event timeline.

Filters:

- Campaign.
- Customer.
- Channel.
- Status.

### 11. Channel Simulator

Purpose:

- Demonstrate that campaign delivery is handled by a separate service and callbacks update CRM analytics.

Visible data:

- Received dispatch requests.
- Simulated message IDs.
- Event status generated for each dispatch.
- Callback delivery attempts.

Primary actions:

- Trigger deterministic delivery simulation.
- Trigger failure simulation.
- Replay a callback to prove idempotency.

Supported channels (simulator):

- Email
- SMS
- WhatsApp
- RCS

RCS simulation behaviour (MVP):

- `sent` — simulator accepts dispatch and returns a simulated message ID.
- `delivered` — simulator emits a delivery event.
- `opened` — optional, simulator may emit an open event for RCS messages.
- `clicked` — optional, simulator may emit a click event for RCS messages.

RCS should behave similarly to WhatsApp in the MVP simulator configuration.

## Seed Data Strategy

Purpose:

- Provide a simple, repeatable way for evaluators to populate realistic CRM data for segmentation, campaign, analytics, and AI testing without manual entry.

Folder layout (documentation only):

- `backend/src/seeds/`
   - `customers.seed.js` — generates 100 realistic Indian customers with mixed cities, consent, and loyalty tiers.
   - `orders.seed.js` — generates 500 orders distributed across customers with randomized amounts, categories, and purchase dates across the previous 12 months.

Seed requirements (spec):

- Customers:
   - Count: 100
   - Names: Realistic Indian names (mix of given and family names)
   - Cities distribution: Mumbai, Delhi, Bangalore, Hyderabad, Pune, Chennai (mixed)
   - Consent: randomized booleans across channels (`email`, `sms`, `whatsapp`, `rcs`, `push`)
   - Loyalty tiers: `Silver`, `Gold`, `Platinum` (mixed)

- Orders:
   - Count: 500
   - Random `grandTotal` amounts sampled from realistic ranges
   - Categories: `Fashion`, `Beauty`, `Coffee`, `Electronics`, `Grocery`
   - `orderedAt`: randomized timestamps across the previous 12 months
   - Associate orders to the generated customers (uniform-ish distribution)

Seed data goals:

- Enable segmentation demos (e.g. high-value customers by city)
- Enable campaign demos (audience sizes large enough to queue messages)
- Enable analytics demos (meaningful aggregates over 12 months)
- Enable AI-generated segment testing (diverse customer attributes and consent states)

Planned CLI commands (documentation only):

```bash
npm run seed:customers
npm run seed:orders
npm run seed         # runs both
```

Notes:

- These scripts are documentation-only in this phase. Implementation will live under `backend/src/seeds/` if/when seeded code is added.

## Demo Readiness

Objective:

- Ensure an evaluator can run a short checklist and immediately demo the system without manual bulk data entry.

Checklist for demo readiness:

1. Start MongoDB and ensure the connection string is available to the backend.
2. Run the seed scripts (`npm run seed`).
3. Start the CRM backend.
4. Start the channel simulator service.

After these steps the evaluator should be able to:

- Create segments immediately (manual or AI prompt).
- Launch campaigns immediately (no manual data creation required).
- View campaign analytics immediately with meaningful aggregates.

This section is documentation-only; no seed scripts are added in this change.

## 2. Exact User Flow

### Primary Demo Flow

1. Evaluator starts the CRM backend, MongoDB, and channel simulator.
2. Evaluator seeds or creates customers and orders.
3. Marketer opens the Dashboard and confirms customer/order totals.
4. Marketer opens Segments.
5. Marketer creates a segment manually or enters an AI prompt such as:

```text
Customers from Mumbai with lifetime value above 10000 and email consent.
```

6. System converts the prompt into structured segment rules.
7. Marketer previews the segment and sees estimated audience size.
8. Marketer saves the segment as active.
9. Marketer opens Campaign Builder.
10. Marketer selects channel `email`, selects the saved segment, and enters campaign goal:

```text
Announce a monsoon sale with 20 percent discount.
```

11. AI generates a subject and message body.
12. Marketer edits or accepts the generated content.
13. Marketer creates a campaign draft.
14. Marketer launches the campaign.
15. CRM backend resolves eligible customers from the segment.
16. CRM backend creates one communication log per eligible customer.
17. CRM backend sends dispatch requests to the channel simulator.
18. Channel simulator returns accepted message IDs.
19. Channel simulator asynchronously calls CRM callback endpoint with delivery events.
20. CRM backend updates communication logs idempotently.
21. CRM backend updates campaign analytics counters.
22. Marketer opens Campaign Analytics.
23. Marketer sees delivery metrics and an AI-generated performance summary.

### Secondary Audit Flow

1. Marketer opens Communication Logs.
2. Marketer filters by campaign.
3. Marketer opens one communication log.
4. Marketer sees the recipient, current status, channel message ID, and event timeline.
5. Evaluator replays the same callback event.
6. CRM returns duplicate callback acknowledgement without double-counting analytics.

## 3. Exact AI Features

AI features must be practical, deterministic enough for evaluation, and isolated behind service boundaries. The product must still work if AI is disabled by using manual inputs.

### AI Feature 1: Natural Language Segment Builder

Input:

- Plain-language audience description.

Output:

- Structured segment rule draft using supported MVP fields and operators.
- Human-readable rule explanation.
- Confidence or validation status.

Supported fields:

- `customer.attributes.city`
- `customer.attributes.loyaltyTier`
- `customer.lifetimeValue`
- `customer.orderCount`
- `customer.lastOrderAt`
- `customer.consent.email`
- `customer.consent.sms`
- `customer.consent.whatsapp`
 - `customer.consent.whatsapp`
 - `customer.consent.rcs`

Supported operators:

- `eq`
- `gte`
- `lte`
- `gt`
- `lt`
- `in`
- `between`

Guardrails:

- Reject unsupported fields.
- Ask for clarification or return validation errors for ambiguous prompts.
- Never launch campaigns directly from AI output.
- AI output must be saved as normal segment rules before use.

### AI Feature 2: Campaign Message Generator

Input:

- Campaign goal.
- Selected channel.
- Segment summary.
- Optional tone.
- Optional offer details.

Output:

- Email subject when channel is `email`.
- Message body.
- Short rationale for why the message fits the segment.

Constraints:

- SMS output should be short enough for practical SMS use.
- WhatsApp output should be conversational but concise.
- Email output should include subject and body.
- Generated content is editable before campaign creation.

### AI Feature 3: Campaign Performance Summary

Input:

- Campaign metrics.
- Campaign channel.
- Audience size.
- Segment summary.

Output:

- 2-4 sentence summary.
- Strongest metric.
- Weakest metric.
- One suggested next action.

Constraints:

- Do not invent metrics.
- If campaign has no delivery events yet, summarize that data is pending.
- Keep recommendations operational and simple.

## 4. Exact Backend Services

The backend follows the MVC architecture already defined in `docs/architecture.md`.

### CustomerService

Responsibilities:

- Create customer.
- List customers with search and filters.
- Get customer by ID.
- Update customer profile, status, and consent.
- Maintain denormalized customer aggregates when orders change.

### OrderService

Responsibilities:

- Create order.
- List orders with filters.
- Get order by ID.
- Update order status.
- Recalculate customer `lifetimeValue`, `orderCount`, and `lastOrderAt`.

### SegmentService

Responsibilities:

- Create segment.
- List segments.
- Get segment by ID.
- Update segment and increment version when rules change.
- Validate supported rule shape.
- Compile rules into MongoDB queries.
- Preview estimated audience size.
- Resolve launch audience with channel consent enforcement.

### AiSegmentService

Responsibilities:

- Convert natural-language audience prompts into supported structured rules.
- Validate generated rules through `SegmentService`.
- Return generated rules without saving unless explicitly requested.

### CampaignService

Responsibilities:

- Create campaign draft.
- List campaigns.
- Get campaign by ID.
- Update draft or scheduled campaign.
- Launch campaign.
- Cancel draft or scheduled campaign.
- Store launch-time segment version and audience snapshot.
- Create communication logs for resolved recipients.

### AiCampaignService

Responsibilities:

- Generate campaign message subject/body from marketer input.
- Generate campaign performance summary from actual analytics data.
- Return editable content and summaries only.

### CommunicationLogService

Responsibilities:

- Create communication logs during campaign launch.
- List communication logs.
- Get communication log by ID.
- Store channel message IDs.
- Apply callback events idempotently.
- Maintain event timeline.

### ChannelServiceClient

Responsibilities:

- Send dispatch requests to the separate channel simulator.
- Include campaign, communication log, customer, recipient, channel, content, and callback URL.
- Normalize channel simulator responses.
- Surface dispatch failures to `CampaignService`.

### CallbackService

Responsibilities:

- Validate callback payload shape.
- Verify callback authentication if configured.
- Detect duplicate `eventId`.
- Delegate event application to `CommunicationLogService`.
- Trigger analytics updates.

### AnalyticsService

Responsibilities:

- Calculate campaign metrics from communication logs.
- Maintain denormalized campaign counters.
- Return rates for dashboard and campaign analytics.
- Provide metric input to `AiCampaignService`.

### HealthService

Responsibilities:

- Report backend health.
- Report MongoDB connectivity.
- Optionally report channel simulator reachability.

## 5. Exact Channel Simulator Behavior

The channel simulator is a separate service from the CRM backend. It does not send real emails, SMS, or WhatsApp messages.

### Dispatch Endpoint Behavior

When the CRM backend sends a dispatch request, the simulator must:

1. Accept the request.
2. Validate required fields:
   - `campaignId`
   - `communicationLogId`
   - `customerId`
   - `channel`
   - `recipient`
   - `payload`
   - `callbackUrl`
3. Generate a stable `messageId`.
4. Return an accepted response to the CRM backend.
5. Schedule simulated callback events.

### Supported Channels

MVP supported channels:

- `email`
- `sms`
- `whatsapp`

All channels use the same simulator logic with channel-specific recipient validation.

### Simulated Event Sequence

Default success path:

1. `sent`
2. `delivered`
3. Optional `opened` for email and WhatsApp.
4. Optional `clicked` when the message payload contains a link or campaign offer.

Default failure path:

1. `sent`
2. `failed` or `bounced`

### Deterministic Simulation Rules

To keep evaluation repeatable:

- If recipient contains `fail`, emit `failed`.
- If recipient contains `bounce`, emit `bounced`.
- If channel is `email` and recipient does not contain `fail` or `bounce`, emit `sent`, `delivered`, `opened`, and optionally `clicked`.
- If channel is `sms`, emit `sent` and `delivered` unless failure is triggered.
- If channel is `whatsapp`, emit `sent`, `delivered`, and optionally `opened`.

### Callback Behavior

The simulator must call:

```text
POST /api/v1/callbacks/channel-events
```

Callback payload must include:

- `eventId`
- `messageId`
- `communicationLogId`
- `campaignId`
- `customerId`
- `eventType`
- `eventTimestamp`
- `metadata`

### Idempotency Demo

The simulator must support replaying the same callback event with the same `eventId`. The CRM backend must acknowledge the duplicate without applying metrics twice.

## 6. Exact Analytics Metrics

### Stored Counters

Campaign metrics must include:

- `audienceSize`: number of customers resolved at launch.
- `queued`: communication logs created.
- `sent`: messages accepted as sent by simulator callback.
- `delivered`: messages delivered.
- `opened`: messages opened.
- `clicked`: messages clicked.
- `bounced`: messages bounced.
- `failed`: messages failed.
- `unsubscribed`: unsubscribe events received.
- `converted`: conversion events attributed to the campaign.

### Derived Rates

Rates should be returned as decimals between `0` and `1`.

- `deliveryRate = delivered / sent`
- `failureRate = (failed + bounced) / queued`
- `openRate = opened / delivered`
- `clickRate = clicked / delivered`
- `conversionRate = converted / delivered`

If the denominator is `0`, return `0`.

### Dashboard Metrics

Dashboard should expose:

- Total customers.
- Total orders.
- Total segments.
- Total campaigns.
- Campaigns by status.
- Recent campaigns.
- Aggregate sent, delivered, failed, opened, clicked across campaigns.

### Communication-Level Metrics

Each communication log should expose:

- Current status.
- Event timeline.
- Last event timestamp.
- Channel message ID.
- Error code and message when failed.

## 7. MVP Features

The following features are in scope for the 2-3 day assignment build.

### Backend Foundation

- Node.js Express backend.
- MongoDB with Mongoose.
- Clean MVC folder structure.
- Centralized error handling.
- Request validation.
- Environment-based configuration.
- Health endpoint.

### CRM Data

- Customer create, list, get, update.
- Order create, list, get, status update.
- Customer aggregate recalculation from orders.
- Seed data for demo customers and orders.

### Segmentation

- Segment create, list, get, update.
- Rule validation.
- Audience preview count.
- Audience resolution during campaign launch.
- Channel consent enforcement.
- AI segment generation from plain-language prompt.

### Campaigns

- Campaign create, list, get, update.
- Campaign launch.
- Campaign cancel before launch.
- Launch-time audience snapshot.
- One communication log per campaign recipient.
- AI campaign message generation.

### Channel Simulator

- Separate service or clearly separated module/process.
- Dispatch endpoint.
- Deterministic delivery simulation.
- CRM callback invocation.
- Duplicate callback replay for idempotency proof.

### Communication Logs And Analytics

- Communication log list and get.
- Callback event ingestion.
- Idempotent callback processing.
- Campaign metric counters.
- Campaign analytics endpoint.
- AI campaign performance summary.

### Documentation

- Architecture document.
- Database design document.
- API contracts document.
- Final frozen product scope document.

## 8. Features Intentionally Excluded

The following are excluded to keep the assignment realistic and completable within 2-3 days.

### Product Exclusions

- Full frontend implementation.
- Drag-and-drop journey builder.
- Multi-step campaign automation flows.
- Recurring campaigns.
- A/B testing.
- Coupon inventory management.
- Real payment or ecommerce integrations.
- Real email, SMS, WhatsApp, or push provider integration.
- Template marketplace.
- Rich HTML email editor.
- Media uploads.
- Image generation.
- Multi-tenant organization management.
- Advanced role-based access control UI.
- Billing, subscriptions, or usage metering.

### Backend Exclusions

- Distributed queue infrastructure such as Kafka, RabbitMQ, or BullMQ.
- WebSockets or real-time dashboards.
- Complex event sourcing.
- Full audit-log subsystem beyond communication event timelines.
- Data warehouse or OLAP pipeline.
- Advanced attribution modeling.
- Automatic retry orchestration for failed channel sends.
- Production-grade secret rotation.
- Horizontal scaling configuration.

### AI Exclusions

- Autonomous campaign launch.
- AI choosing recipients without explicit saved segment rules.
- AI modifying customer data.
- AI-generated images or creatives.
- AI training or fine-tuning.
- Long-running agentic campaign optimization.
- Predictive customer lifetime value modeling.
- Churn prediction model training.
- Personalized message generation per recipient.

### Analytics Exclusions

- Revenue attribution beyond simple conversion count.
- Cohort analysis.
- Funnel analysis across multiple campaigns.
- Customer-level predictive scoring.
- Real-time streaming analytics.
- Custom dashboard builder.

## Final Build Boundary

The final MVP is considered complete when the following end-to-end path works:

1. Customers and orders exist in MongoDB.
2. A marketer can define or AI-generate a segment.
3. The segment can be previewed.
4. A campaign can be created for that segment.
5. AI can generate editable campaign content.
6. The campaign can be launched.
7. The CRM creates communication logs.
8. The channel simulator accepts dispatches.
9. The simulator sends callback events.
10. The CRM updates communication statuses and metrics idempotently.
11. Campaign analytics and AI performance summary can be retrieved.

Anything outside this boundary is intentionally deferred.
