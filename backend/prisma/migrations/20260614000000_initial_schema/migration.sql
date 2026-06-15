CREATE TYPE "CustomerStatus" AS ENUM ('active', 'inactive', 'blocked', 'deleted');
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded');
CREATE TYPE "SegmentStatus" AS ENUM ('draft', 'active', 'archived');
CREATE TYPE "CampaignType" AS ENUM ('promotional', 'transactional', 'winback', 'announcement');
CREATE TYPE "Channel" AS ENUM ('email', 'sms', 'whatsapp', 'push', 'rcs');
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled', 'failed');
CREATE TYPE "CommunicationStatus" AS ENUM ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed', 'converted');

CREATE TABLE "customers" (
  "id" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "externalId" TEXT,
  "status" "CustomerStatus" NOT NULL DEFAULT 'active',
  "attributes" JSONB,
  "lifetimeValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "orderCount" INTEGER NOT NULL DEFAULT 0,
  "lastOrderAt" TIMESTAMP(3),
  "consentEmail" BOOLEAN NOT NULL DEFAULT false,
  "consentSms" BOOLEAN NOT NULL DEFAULT false,
  "consentWhatsapp" BOOLEAN NOT NULL DEFAULT false,
  "consentPush" BOOLEAN NOT NULL DEFAULT false,
  "consentRcs" BOOLEAN NOT NULL DEFAULT false,
  "consentUpdatedAt" TIMESTAMP(3),
  "source" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "externalOrderId" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'pending',
  "currency" TEXT NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "shippingTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "grandTotal" DECIMAL(12,2) NOT NULL,
  "items" JSONB NOT NULL,
  "orderedAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "segments" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "SegmentStatus" NOT NULL DEFAULT 'draft',
  "rules" JSONB NOT NULL,
  "estimatedAudienceSize" INTEGER,
  "lastEvaluatedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campaigns" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "CampaignType" NOT NULL,
  "channel" "Channel" NOT NULL,
  "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
  "segmentId" TEXT NOT NULL,
  "segmentVersion" INTEGER,
  "templateId" TEXT,
  "content" JSONB NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "launchedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "audienceSnapshot" JSONB,
  "metrics" JSONB NOT NULL,
  "failureReason" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "communicationlogs" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "channel" "Channel" NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" "CommunicationStatus" NOT NULL DEFAULT 'queued',
  "channelMessageId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "events" JSONB NOT NULL,
  "lastEventAt" TIMESTAMP(3),
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "communicationlogs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aiSessions" (
  "id" TEXT NOT NULL,
  "userPrompt" TEXT NOT NULL,
  "generatedSegment" JSONB,
  "generatedMessage" JSONB,
  "recommendedChannel" "Channel",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "aiSessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");
CREATE UNIQUE INDEX "customers_externalId_key" ON "customers"("externalId");
CREATE INDEX "customers_status_createdAt_idx" ON "customers"("status", "createdAt");

CREATE UNIQUE INDEX "orders_externalOrderId_key" ON "orders"("externalOrderId");
CREATE INDEX "orders_customerId_orderedAt_idx" ON "orders"("customerId", "orderedAt");
CREATE INDEX "orders_status_orderedAt_idx" ON "orders"("status", "orderedAt");

CREATE INDEX "segments_status_updatedAt_idx" ON "segments"("status", "updatedAt");

CREATE INDEX "campaigns_status_scheduledAt_idx" ON "campaigns"("status", "scheduledAt");
CREATE INDEX "campaigns_segmentId_createdAt_idx" ON "campaigns"("segmentId", "createdAt");

CREATE UNIQUE INDEX "communicationlogs_channelMessageId_key" ON "communicationlogs"("channelMessageId");
CREATE UNIQUE INDEX "communicationlogs_idempotencyKey_key" ON "communicationlogs"("idempotencyKey");
CREATE UNIQUE INDEX "communicationlogs_campaignId_customerId_channel_key" ON "communicationlogs"("campaignId", "customerId", "channel");
CREATE INDEX "communicationlogs_campaignId_status_idx" ON "communicationlogs"("campaignId", "status");
CREATE INDEX "communicationlogs_customerId_createdAt_idx" ON "communicationlogs"("customerId", "createdAt");

CREATE INDEX "aiSessions_createdAt_idx" ON "aiSessions"("createdAt");

ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "communicationlogs" ADD CONSTRAINT "communicationlogs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "communicationlogs" ADD CONSTRAINT "communicationlogs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
