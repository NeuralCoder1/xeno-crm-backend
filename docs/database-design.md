# Database Design

## Overview

MongoDB stores the CRM domain state using primary collections:

- `customers`
- `orders`
- `segments`
- `campaigns`
- `communicationlogs`
- `aiSessions`

Mongoose should define schemas for each model with timestamps enabled. All documents should use MongoDB ObjectIds as primary identifiers and expose string IDs at the API layer.

## Common Fields

Most persisted documents should include:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | MongoDB primary key |
| `createdAt` | Date | Yes | Managed by Mongoose timestamps |
| `updatedAt` | Date | Yes | Managed by Mongoose timestamps |
| `createdBy` | ObjectId/String | No | User or integration that created the record |
| `updatedBy` | ObjectId/String | No | User or integration that last changed the record |

## Customer Schema

Stores customer identity, contactability, consent, and marketer-defined attributes.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `firstName` | String | No | Customer first name |
| `lastName` | String | No | Customer last name |
| `email` | String | Conditional | Required if email channel is used; unique when present |
| `phone` | String | Conditional | Required if SMS or WhatsApp channel is used; unique when present |
| `externalId` | String | No | Optional ID from merchant, CDP, or ecommerce system |
| `status` | String enum | Yes | `active`, `inactive`, `blocked`, `deleted` |
| `attributes` | Mixed/Object | No | Flexible customer traits such as city, gender, loyalty tier |
| `lifetimeValue` | Number | Yes | Denormalized total completed order value |
| `orderCount` | Number | Yes | Denormalized completed order count |
| `lastOrderAt` | Date | No | Latest completed order timestamp |
| `consent.email` | Boolean | Yes | Email marketing consent |
| `consent.sms` | Boolean | Yes | SMS marketing consent |
| `consent.whatsapp` | Boolean | Yes | WhatsApp marketing consent |
| `consent.push` | Boolean | Yes | Push marketing consent |
| `consent.rcs` | Boolean | Yes | RCS messaging consent |
| `consent.updatedAt` | Date | No | Last consent change timestamp |
| `source` | String | No | Import source or integration name |

Recommended indexes:

- Unique sparse index on `email`.
- Unique sparse index on `phone`.
- Unique sparse index on `externalId`.
- Compound index on `{ status: 1, createdAt: -1 }`.
- Index on commonly queried dynamic attributes if they become stable product filters.

## Order Schema

Stores order data linked to a customer. Orders drive segmentation and conversion analytics.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `customerId` | ObjectId ref Customer | Yes | Customer who placed the order |
| `externalOrderId` | String | No | Optional order ID from commerce system |
| `status` | String enum | Yes | `pending`, `paid`, `fulfilled`, `cancelled`, `refunded` |
| `currency` | String | Yes | ISO currency code such as `INR` or `USD` |
| `subtotal` | Number | Yes | Pre-discount item total |
| `discountTotal` | Number | Yes | Total discount amount |
| `taxTotal` | Number | Yes | Total tax amount |
| `shippingTotal` | Number | Yes | Shipping amount |
| `grandTotal` | Number | Yes | Final order total |
| `items` | Array<Object> | Yes | Purchased items |
| `items.sku` | String | No | Product SKU |
| `items.name` | String | Yes | Product name |
| `items.category` | String | No | Product category |
| `items.quantity` | Number | Yes | Quantity purchased |
| `items.unitPrice` | Number | Yes | Unit price |
| `orderedAt` | Date | Yes | Business timestamp for the order |
| `metadata` | Mixed/Object | No | Integration-specific values |

Recommended indexes:

- Compound index on `{ customerId: 1, orderedAt: -1 }`.
- Unique sparse index on `externalOrderId`.
- Compound index on `{ status: 1, orderedAt: -1 }`.
- Index on `items.category` if category segmentation is required.

## Segment Schema

Stores reusable audience rule definitions.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | String | Yes | Human-readable segment name |
| `description` | String | No | Segment purpose |
| `status` | String enum | Yes | `draft`, `active`, `archived` |
| `rules` | Object | Yes | Rule tree used to resolve customers |
| `rules.operator` | String enum | Yes | `and` or `or` |
| `rules.conditions` | Array<Object> | Yes | Rule conditions or nested groups |
| `estimatedAudienceSize` | Number | No | Last computed preview count |
| `lastEvaluatedAt` | Date | No | Last preview/evaluation timestamp |
| `version` | Number | Yes | Incremented when rules change |

Supported condition shape:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `field` | String | Yes | Example: `customer.city`, `order.grandTotal`, `customer.lifetimeValue` |
| `operator` | String enum | Yes | `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `contains`, `exists`, `between` |
| `value` | Mixed | Conditional | Single value or array depending on operator |

Recommended indexes:

- Compound index on `{ status: 1, updatedAt: -1 }`.
- Text index on `name` and `description`.

## Campaign Schema

Stores campaign metadata, target segment, lifecycle state, and aggregate performance.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | String | Yes | Campaign name |
| `description` | String | No | Campaign purpose |
| `type` | String enum | Yes | `promotional`, `transactional`, `winback`, `announcement` |
| `channel` | String enum | Yes | `email`, `sms`, `whatsapp`, `push`, `rcs` |
| `status` | String enum | Yes | `draft`, `scheduled`, `running`, `paused`, `completed`, `cancelled`, `failed` |
| `segmentId` | ObjectId ref Segment | Yes | Target audience definition |
| `segmentVersion` | Number | Yes after launch | Segment version used at launch |
| `templateId` | String | No | Template reference owned by channel service or template catalog |
| `content` | Object | Yes | Subject/body or channel-specific payload |
| `scheduledAt` | Date | No | Future launch time |
| `launchedAt` | Date | No | Actual launch timestamp |
| `completedAt` | Date | No | Completion timestamp |
| `audienceSnapshot` | Object | No | Launch-time summary of targeting rules and count |
| `metrics` | Object | Yes | Denormalized aggregate counters |
| `failureReason` | String | No | High-level reason when launch fails |

Recommended `metrics` fields:

| Field | Type |
| --- | --- |
| `queued` | Number |
| `sent` | Number |
| `delivered` | Number |
| `opened` | Number |
| `clicked` | Number |
| `bounced` | Number |
| `failed` | Number |
| `unsubscribed` | Number |
| `converted` | Number |

Recommended indexes:

- Compound index on `{ status: 1, scheduledAt: 1 }`.
- Compound index on `{ segmentId: 1, createdAt: -1 }`.
- Text index on `name` and `description`.

## CommunicationLog Schema

Stores per-customer campaign communication attempts and callback event history.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `campaignId` | ObjectId ref Campaign | Yes | Campaign that created this communication |
| `customerId` | ObjectId ref Customer | Yes | Recipient customer |
| `channel` | String enum | Yes | `email`, `sms`, `whatsapp`, `push`, `rcs` |
| `recipient` | String | Yes | Email address, phone number, or device token used |
| `status` | String enum | Yes | `queued`, `sent`, `delivered`, `opened`, `clicked`, `bounced`, `failed`, `unsubscribed`, `converted` |
| `channelMessageId` | String | No | Message ID returned by channel service |
| `idempotencyKey` | String | Yes | Prevents duplicate dispatch attempts |
| `events` | Array<Object> | Yes | Callback event timeline |
| `events.eventId` | String | Yes | Unique channel event ID |
| `events.type` | String | Yes | Event type |
| `events.occurredAt` | Date | Yes | Event timestamp from channel service |
| `events.receivedAt` | Date | Yes | CRM receipt timestamp |
| `events.metadata` | Mixed/Object | No | Channel-specific details |
| `lastEventAt` | Date | No | Latest event timestamp |
| `errorCode` | String | No | Failure code |
| `errorMessage` | String | No | Failure message |

Recommended indexes:

- Unique compound index on `{ campaignId: 1, customerId: 1, channel: 1 }`.
- Unique sparse index on `channelMessageId`.
- Unique index on `idempotencyKey`.
- Compound index on `{ campaignId: 1, status: 1 }`.
- Compound index on `{ customerId: 1, createdAt: -1 }`.
- Index on `events.eventId` for callback idempotency checks.

## AISession Schema

Stores AI assistant interactions for auditability and analytics.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `userPrompt` | String | Yes | Original prompt or query provided to AI |
| `generatedSegment` | Object | No | Machine-generated segment rules or reference |
| `generatedMessage` | Object | No | Machine-generated message payload (subject/body or channel payload) |
| `recommendedChannel` | String | No | Channel recommended by AI, e.g. `email`, `sms`, `whatsapp`, `rcs`, `push` |
| `createdAt` | Date | Yes | Timestamp when the AI interaction occurred |

Recommended indexes:

- Index on `{ createdAt: -1 }` for recent session lookups.
- Text index on `userPrompt` for searching historical prompts.

Purpose:

- Store AI assistant interactions to provide audit trails, allow reproducibility, and enable later analytics over prompts, outputs, and channel choices.


## Relationships

```text
Customer 1 --- N Order
Customer 1 --- N CommunicationLog
Segment  1 --- N Campaign
Campaign 1 --- N CommunicationLog
```

Campaigns reference segments, but launched campaign behavior should not change when the segment is edited later. Store `segmentVersion` and `audienceSnapshot` on the campaign at launch time.

## Data Consistency Rules

- A campaign can be launched only from `draft` or `scheduled`.
- A campaign must reference an `active` segment before launch.
- A communication log must reference an existing campaign and customer.
- A callback event must not be applied twice.
- Customer consent must be checked before creating a communication log.
- Cancelled, refunded, or failed orders should not increase `lifetimeValue` unless the business explicitly defines otherwise.

## Deletion Strategy

Use soft deletion for customer records by setting `status` to `deleted` where possible. Hard deletion may be required for compliance workflows, but should be handled through a dedicated privacy process that also cleans or anonymizes communication logs.

Campaigns and communication logs should generally be immutable audit records after launch.
