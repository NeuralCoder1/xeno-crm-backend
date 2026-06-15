# API Contracts

## Conventions

Base path:

```text
/api/v1
```

Default response envelope:

```json
{
  "success": true,
  "data": {},
  "requestId": "req_123"
}
```

Default error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request payload is invalid.",
    "details": []
  },
  "requestId": "req_123"
}
```

Pagination query parameters:

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | Number | `1` | 1-based page number |
| `limit` | Number | `25` | Maximum should be capped by server |
| `sort` | String | `-createdAt` | Prefix with `-` for descending |

Paginated response metadata:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  },
  "requestId": "req_123"
}
```

## Health

### GET `/health`

Returns service and database health.

Response `200`:

```json
{
  "success": true,
  "data": {
    "service": "crm-backend",
    "status": "ok",
    "database": "connected"
  },
  "requestId": "req_123"
}
```

## Customers

### POST `/customers`

Creates a customer.

Request:

```json
{
  "firstName": "Asha",
  "lastName": "Mehta",
  "email": "asha@example.com",
  "phone": "+919999999999",
  "externalId": "shopify_customer_1001",
  "attributes": {
    "city": "Mumbai",
    "loyaltyTier": "gold"
  },
  "consent": {
    "email": true,
    "sms": true,
    "whatsapp": false,
    "push": false,
    "rcs": false
  },
  "source": "shopify"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "666d00000000000000000001",
    "firstName": "Asha",
    "lastName": "Mehta",
    "email": "asha@example.com",
    "phone": "+919999999999",
    "status": "active",
    "lifetimeValue": 0,
    "orderCount": 0
  },
  "requestId": "req_123"
}
```

### GET `/customers`

Lists customers.

Supported filters:

| Query | Type | Notes |
| --- | --- | --- |
| `search` | String | Searches name, email, or phone |
| `status` | String | `active`, `inactive`, `blocked`, `deleted` |
| `city` | String | Optional customer attribute filter |
| `loyaltyTier` | String | Optional customer attribute filter |

### GET `/customers/:customerId`

Returns one customer by ID.

### PATCH `/customers/:customerId`

Updates mutable customer fields such as name, attributes, status, and consent.

### GET `/customers/:customerId/orders`

Returns orders for one customer.

## Orders

### POST `/orders`

Creates an order linked to a customer.

Request:

```json
{
  "customerId": "666d00000000000000000001",
  "externalOrderId": "order_9001",
  "status": "paid",
  "currency": "INR",
  "subtotal": 2500,
  "discountTotal": 250,
  "taxTotal": 100,
  "shippingTotal": 50,
  "grandTotal": 2400,
  "items": [
    {
      "sku": "TSHIRT-BLK-M",
      "name": "Black T-Shirt",
      "category": "Apparel",
      "quantity": 2,
      "unitPrice": 1250
    }
  ],
  "orderedAt": "2026-06-14T08:30:00.000Z",
  "metadata": {
    "store": "online"
  }
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "666d00000000000000000002",
    "customerId": "666d00000000000000000001",
    "status": "paid",
    "grandTotal": 2400,
    "orderedAt": "2026-06-14T08:30:00.000Z"
  },
  "requestId": "req_123"
}
```

### GET `/orders`

Lists orders.

Supported filters:

| Query | Type | Notes |
| --- | --- | --- |
| `customerId` | String | Orders for one customer |
| `status` | String | Order status |
| `from` | Date | Minimum `orderedAt` |
| `to` | Date | Maximum `orderedAt` |

### GET `/orders/:orderId`

Returns one order by ID.

### PATCH `/orders/:orderId/status`

Updates order status and triggers customer aggregate recalculation when needed.

Request:

```json
{
  "status": "refunded"
}
```

## Segments

### POST `/segments`

Creates an audience segment.

Request:

```json
{
  "name": "High value Mumbai customers",
  "description": "Customers in Mumbai with lifetime value over 10000.",
  "status": "active",
  "rules": {
    "operator": "and",
    "conditions": [
      {
        "field": "customer.attributes.city",
        "operator": "eq",
        "value": "Mumbai"
      },
      {
        "field": "customer.lifetimeValue",
        "operator": "gte",
        "value": 10000
      }
    ]
  }
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "666d00000000000000000003",
    "name": "High value Mumbai customers",
    "status": "active",
    "version": 1,
    "estimatedAudienceSize": null
  },
  "requestId": "req_123"
}
```

### GET `/segments`

Lists segments.

### GET `/segments/:segmentId`

Returns a segment by ID.

### PATCH `/segments/:segmentId`

Updates segment metadata or rules. Rule changes increment `version`.

### POST `/segments/:segmentId/preview`

Calculates the estimated matching audience size without launching a campaign.

Response `200`:

```json
{
  "success": true,
  "data": {
    "segmentId": "666d00000000000000000003",
    "estimatedAudienceSize": 1250,
    "evaluatedAt": "2026-06-14T09:00:00.000Z"
  },
  "requestId": "req_123"
}
```

## Campaigns

### POST `/campaigns`

Creates a campaign draft.

Request:

```json
{
  "name": "Monsoon Sale",
  "description": "Promotional campaign for high value customers.",
  "type": "promotional",
  "channel": "email",
  "segmentId": "666d00000000000000000003",
  "templateId": "email_template_monsoon_sale",
  "content": {
    "subject": "Your monsoon offer is here",
    "body": "Use code MONSOON20 for your next order."
  },
  "scheduledAt": null
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "666d00000000000000000004",
    "name": "Monsoon Sale",
    "status": "draft",
    "channel": "email",
    "segmentId": "666d00000000000000000003"
  },
  "requestId": "req_123"
}
```

### GET `/campaigns`

Lists campaigns.

Supported filters:

| Query | Type | Notes |
| --- | --- | --- |
| `status` | String | Campaign lifecycle status |
| `channel` | String | `email`, `sms`, `whatsapp`, `push`, `rcs` |
| `segmentId` | String | Campaigns for one segment |

### GET `/campaigns/:campaignId`

Returns campaign details.

### PATCH `/campaigns/:campaignId`

Updates draft or scheduled campaigns. Launched campaigns should allow only limited status transitions.

### POST `/campaigns/:campaignId/launch`

Launches a campaign immediately or confirms scheduled dispatch.

Headers:

| Header | Required | Notes |
| --- | --- | --- |
| `Idempotency-Key` | Recommended | Prevents duplicate launch requests |

Response `202`:

```json
{
  "success": true,
  "data": {
    "campaignId": "666d00000000000000000004",
    "status": "running",
    "audienceSize": 1250,
    "queuedCommunications": 1250
  },
  "requestId": "req_123"
}
```

### POST `/campaigns/:campaignId/cancel`

Cancels a draft, scheduled, or paused campaign. Running campaign cancellation depends on channel-service support.

### GET `/campaigns/:campaignId/analytics`

Returns campaign metrics.

Response `200`:

```json
{
  "success": true,
  "data": {
    "campaignId": "666d00000000000000000004",
    "metrics": {
      "queued": 1250,
      "sent": 1200,
      "delivered": 1100,
      "opened": 420,
      "clicked": 95,
      "bounced": 20,
      "failed": 30,
      "unsubscribed": 5,
      "converted": 18
    },
    "rates": {
      "deliveryRate": 0.9167,
      "openRate": 0.3818,
      "clickRate": 0.0864,
      "conversionRate": 0.0144
    }
  },
  "requestId": "req_123"
}
```

## Communication Logs

### GET `/communication-logs`

Lists communication logs.

Supported filters:

| Query | Type | Notes |
| --- | --- | --- |
| `campaignId` | String | Logs for one campaign |
| `customerId` | String | Logs for one customer |
| `status` | String | Delivery/event status |
| `channel` | String | Communication channel |

### GET `/communication-logs/:communicationLogId`

Returns one communication log and event timeline.

## Channel Service Callback

### POST `/callbacks/channel-events`

Receives asynchronous events from the separate channel service.

Authentication:

- Use `X-Channel-Signature` for HMAC signatures, or equivalent production callback authentication.
- Use `X-Channel-Timestamp` to prevent replay attacks.

Request:

```json
{
  "eventId": "evt_10001",
  "messageId": "msg_90001",
  "communicationLogId": "666d00000000000000000005",
  "campaignId": "666d00000000000000000004",
  "customerId": "666d00000000000000000001",
  "eventType": "delivered",
  "eventTimestamp": "2026-06-14T09:10:00.000Z",
  "metadata": {
    "provider": "sendgrid",
    "providerStatus": "delivered"
  }
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "eventId": "evt_10001",
    "processed": true
  },
  "requestId": "req_123"
}
```

Duplicate callback response `200`:

```json
{
  "success": true,
  "data": {
    "eventId": "evt_10001",
    "processed": false,
    "reason": "duplicate_event"
  },
  "requestId": "req_123"
}
```

## AI

### POST `/ai/generate-segment`

Request:

```json
{
  "prompt": "Find customers who spent more than ₹5000 and haven't ordered in 30 days"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "generatedSegment": {
      "name": "High value lapsed customers",
      "rules": {
        "operator": "and",
        "conditions": [
          { "field": "customer.lifetimeValue", "operator": "gt", "value": 5000 },
          { "field": "customer.lastOrderAt", "operator": "lt", "value": "2026-05-15T00:00:00.000Z" }
        ]
      }
    }
  },
  "requestId": "req_123"
}
```

### POST `/ai/generate-message`

Request:

```json
{
  "campaignGoal": "Win back inactive customers"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "generatedMessage": {
      "subject": "We miss you — here's 20% off your next order",
      "body": "Hi {{firstName}}, it's been a while — use code WELCOME20 to save on your next purchase."
    }
  },
  "requestId": "req_123"
}
```

### POST `/ai/recommend-channel`

Request:

```json
{
  "campaignType": "Promotional"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "recommendedChannel": "email"
  },
  "requestId": "req_123"
}
```

### POST `/ai/copilot`

Request:

```json
{
  "goal": "Launch a campaign for inactive high-value customers"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "summary": "Created segment + draft campaign",
    "generatedSegment": { "name": "AI: inactive high-value", "id": "666d0000000000000000a1" },
    "generatedMessage": { "subject": "We miss you — here's an exclusive offer" },
    "recommendedChannel": "rcs",
    "campaignDraftId": "666d0000000000000000b1"
  },
  "requestId": "req_123"
}
```

## Status Codes

| Code | Usage |
| --- | --- |
| `200` | Successful read, update, callback acknowledgement |
| `201` | Resource created |
| `202` | Campaign launch accepted for processing |
| `400` | Invalid request or invalid state transition |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `409` | Duplicate resource or idempotency conflict |
| `422` | Semantically invalid domain input |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

## Route-To-Controller Mapping

```text
GET    /health                         healthController.getHealth
POST   /customers                      customerController.createCustomer
GET    /customers                      customerController.listCustomers
GET    /customers/:customerId          customerController.getCustomer
PATCH  /customers/:customerId          customerController.updateCustomer
GET    /customers/:customerId/orders   orderController.listCustomerOrders
POST   /orders                         orderController.createOrder
GET    /orders                         orderController.listOrders
GET    /orders/:orderId                orderController.getOrder
PATCH  /orders/:orderId/status         orderController.updateOrderStatus
POST   /segments                       segmentController.createSegment
GET    /segments                       segmentController.listSegments
GET    /segments/:segmentId            segmentController.getSegment
PATCH  /segments/:segmentId            segmentController.updateSegment
POST   /segments/:segmentId/preview    segmentController.previewSegment
POST   /campaigns                      campaignController.createCampaign
GET    /campaigns                      campaignController.listCampaigns
GET    /campaigns/:campaignId          campaignController.getCampaign
PATCH  /campaigns/:campaignId          campaignController.updateCampaign
POST   /campaigns/:campaignId/launch   campaignController.launchCampaign
POST   /campaigns/:campaignId/cancel   campaignController.cancelCampaign
GET    /campaigns/:campaignId/analytics analyticsController.getCampaignAnalytics
GET    /communication-logs             communicationLogController.listLogs
GET    /communication-logs/:id         communicationLogController.getLog
POST   /callbacks/channel-events       callbackController.handleChannelEvent
POST   /ai/generate-segment           aiController.generateSegment
POST   /ai/generate-message           aiController.generateMessage
POST   /ai/recommend-channel          aiController.recommendChannel
POST   /ai/copilot                    aiController.copilot
```
