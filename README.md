# Xeno CRM Assignment

## Overview

Xeno CRM is an AI-Native Customer Relationship Management and Campaign Management platform. It enables businesses to manage their customer database, construct detailed target segments, and launch automated marketing campaigns across multiple channels (Email, SMS, WhatsApp, and RCS). The platform features an AI Copilot that translates natural language prompts into audience rules, drafts promotional copy, and recommends delivery channels, backed by a resilient multi-process architecture with message scheduling and automated retry flows.

---

## Architecture

The system is split into three independent services designed to decouple campaign orchestration from delivery execution:

* **Frontend**: A Next.js application built with TypeScript, React, and a modern styled component UI.
* **Backend**: An Express.js REST API using TypeScript and Prisma ORM to communicate with PostgreSQL and Redis.
* **PostgreSQL**: Relational database storing customer profiles, segments, campaigns, and delivery logs.
* **Redis**: Acts as an ephemeral job queue for message dispatch, locking, and rate-limiting.
* **Channel Service**: A separate Node.js service simulating message dispatching and tracking delivery lifecycle events (queued, sent, delivered, failed) via webhook callbacks back to the CRM backend.

### ASCII Architecture Diagram

```text
  ┌────────────────────────────────────────────────────────┐
  │                        Frontend                        │
  │                     (Next.js Client)                   │
  └───────────────────────────┬────────────────────────────┘
                              │
                    HTTP REST │ API Requests & UI Actions
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                    Express Backend                     │
  │                  (REST API Service)                    │
  └───────┬────────────┬─────────────┬─────────────┬───────┘
          │            │             │             ▲
   Prisma │     Pub/Sub│      Pub/Sub│             │
     Link │      Queues│     Callback│    HTTP POST│ Webhook Callback
          ▼            ▼             ▼             │ (status update)
  ┌───────────┐  ┌───────────┐  ┌───────────┐      │
  │PostgreSQL │  │   Redis   │  │   Redis   │      │
  │ Database  │  │(Job Queue)│  │(Rate Limit│      │
  └───────────┘  └─────┬─────┘  └───────────┘      │
                       │                           │
              Outbound │ Send message              │
              Delivery │ request                   │
                       ▼                           │
  ┌────────────────────────────────────────────────┴───────┐
  │                    Channel Service                     │
  │              (Delivery Simulation Engine)              │
  └────────────────────────────────────────────────┘
```

---

## Features

* **Authentication**: Demo JWT authentication for simple and secure sign-in.
* **Dashboard**: Key performance indicators (KPIs) showing total customer counts, orders, segments, campaigns, and communication logs.
* **Customers**: Paginated customer list with live search, displaying LTV, orders count, and consent preferences.
* **Segments**: Audience builder allowing rule-based filtering (and plain-text AI-assisted cohort generation).
* **Campaigns**: Creation interface for multi-channel templates, scheduling, and live tracking of campaign dispatches.
* **Communication Logs**: Comprehensive delivery log ledger detailing individual dispatch status, error messages, and events.
* **Retry System**: Capability to manually or automatically trigger redelivery of failed messages.
* **AI Copilot**: Natural language parsing to generate segment filters, message bodies, and recommend the best marketing channels.

---

## Tech Stack

### Frontend
* Next.js (App Router)
* React & TypeScript
* CSS / Tailwind CSS
* Lucide React (Icons)

### Backend
* Express.js & Node.js
* TypeScript
* Prisma ORM
* PostgreSQL
* Redis (Rate limiting and Queues)

---

## Local Setup

Ensure that both PostgreSQL and Redis servers are running locally on their default ports.

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables in `.env` (refer to the Environment Variables section below).
4. Run database migrations:
   ```bash
   npx prisma db push
   ```
5. Seed database with demo data (optional):
   ```bash
   npm run seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the base API URL in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Channel Service

1. Navigate to the channel service directory:
   ```bash
   cd channel-service
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the service (configure PORT and callback endpoint as environment variables):
   * **Linux / macOS**:
     ```bash
     CRM_CALLBACK_URL="http://localhost:5000/api/callbacks/channel-events" PORT=5001 npm run dev
     ```
   * **Windows (PowerShell)**:
     ```powershell
     $env:CRM_CALLBACK_URL="http://localhost:5000/api/callbacks/channel-events"; $env:PORT="5001"; npm run dev
     ```

---

## Environment Variables

### Backend (`backend/.env`)
* `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/xeno_crm`)
* `REDIS_URL`: Redis connection URL (e.g. `redis://localhost:6379`)
* `JWT_SECRET`: Token signature secret key
* `PORT`: Server port (default: `5000`)

### Frontend (`frontend/.env.local`)
* `NEXT_PUBLIC_API_URL`: Backend REST API base URL (e.g. `http://localhost:5000`)

### Channel Service (`channel-service/.env` or Inline)
* `CRM_CALLBACK_URL`: Webhook URL on CRM backend (e.g. `http://localhost:5000/api/callbacks/channel-events`)
* `PORT`: Service port (default: `5001`)

---

## Seed Data

To populate Xeno CRM with sample data, navigate to the `backend` directory and execute:
```bash
npm run seed
```
This script initializes the PostgreSQL database with:
* A demo dataset containing **500 customers** with unique emails, phone numbers, and attributes.
* A corresponding set of customer orders and values to generate realistic Lifetime Value (LTV) stats on the dashboard.

---

## Authentication

Xeno CRM handles user login using JSON Web Tokens (JWT). For evaluation and ease of testing, the system provides a demo sign-in endpoint:
* **Endpoint**: `POST /api/auth/demo-login`
* **Response**: Returns a valid evaluator JWT token which is automatically saved in `localStorage` by the frontend client.

---

## API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/auth/demo-login` | Obtains a demo JWT token |
| `GET` | `/api/dashboard` | Returns summary KPIs (counts for customers, orders, segments, etc.) |
| `GET` | `/api/customers` | Lists customers (supports optional pagination parameters `?page&limit&search`) |
| `GET` | `/api/customers/:id` | Returns details of a specific customer |
| `GET` | `/api/segments` | Lists all defined audience segments |
| `POST` | `/api/segments` | Creates a new segment ruleset |
| `POST` | `/api/segments/:id/preview` | Returns a list of customers currently matching a segment ruleset |
| `GET` | `/api/campaigns` | Lists campaigns (supports `?page&limit`) |
| `POST` | `/api/campaigns` | Creates a new campaign |
| `POST` | `/api/campaigns/:id/launch` | Dispatches campaign messages to the Channel Service |
| `GET` | `/api/communication-logs` | Lists communication delivery logs |
| `GET` | `/api/communication-logs/:id` | Details of a single message dispatch status |
| `POST` | `/api/communication-logs/:id/retry` | Re-queues a failed message dispatch for retry |
| `POST` | `/api/ai/generate-segment` | AI: Translates text prompts into structured segment rules |
| `POST` | `/api/ai/generate-message` | AI: Generates promotional copy based on objective |
| `POST` | `/api/ai/recommend-channel` | AI: Recommends best communication channel based on metadata |
| `POST` | `/api/ai/copilot` | AI: Unified helper service |
| `POST` | `/api/callbacks/channel-events`| Webhook callback from Channel Service updating delivery events status |
| `GET` | `/api/health` | Service health status |

*Note: All backend endpoints are mounted under `/api/*` and aliased under `/api/v1/*` for versioning.*

---

## AI Features

* **Generate Segment**: Generates a set of Prisma-compatible JSON filter conditions from plain text inputs (e.g. "high value customers in Delhi").
* **Generate Message**: Automatically drafts email subject lines and body copy templates aligned to a campaign's tone and objective.
* **Recommend Channel**: Evaluates demographic metadata and audience sizes to recommend the most cost-effective and highest-converting delivery channel.
* **AI Copilot**: A combined sidebar dashboard workspace allowing users to generate both audiences and matching messages in a single continuous flow.

---

## Retry Mechanism

Outbound dispatches that fail to deliver (e.g. invalid contact channels or simulator failures) are tracked in the **Communication Logs** dashboard.
* Evaluators can click the **Retry** action next to any failed log.
* This calls `POST /api/communication-logs/:id/retry` on the backend, which restarts the message dispatch lifecycle by sending a fresh delivery request to the Channel Service.

---

## Screenshots

*Placeholders for user-provided screenshots during evaluation:*

* **Login Page**: [Placeholder for Login Screenshot]
* **Dashboard Overview**: [Placeholder for Dashboard Screenshot]
* **Customer List**: [Placeholder for Customers Screenshot]
* **Segments Builder**: [Placeholder for Segments Screenshot]
* **Campaigns Management**: [Placeholder for Campaigns Screenshot]
* **Communication Logs**: [Placeholder for Logs Screenshot]
* **AI Copilot Sidebar**: [Placeholder for AI Copilot Screenshot]

---

## Project Structure

```text
Xeno-crm/
├── backend/                  # REST API Backend Service
│   ├── prisma/               # Database schemas and seed script
│   └── src/                  # Controllers, routes, services, and server logic
├── frontend/                 # Client Frontend UI
│   ├── app/                  # Next.js App Router layout and pages
│   └── src/                  # API clients, auth helpers, types, and UI components
├── channel-service/          # Message Delivery Simulation Microservice
│   └── src/                  # Simulator express application and route handlers
└── README.md                 # Project README documentation
```

---

## Assumptions

* The PostgreSQL database server is active on `localhost:5432` with a database named `xeno_crm` (creds: `postgres/postgres`).
* The local Redis server is active on port `6379`.
* The development processes are configured to bind to:
  * Backend: port `5000`
  * Frontend: port `3000`
  * Channel Service: port `5001`

---

## Future Improvements

* **User RBAC & Authentication**: Implement production-grade auth (e.g. Auth0, next-auth) with full role-based access control.
* **Real Integrations**: Replace simulated deliveries in the Channel Service with actual provider APIs (e.g. SendGrid, Twilio, Meta Business API).
* **Advanced Rules Engine**: Add support for complex nested logical operators (`AND`/`OR` groups) in the cohort builder UI.
* **Real-time Analytics**: Integrate WebSockets for updating campaign stats on the dashboard dynamically.
