import { Channel, type Prisma } from "@prisma/client";
import { env } from "../config/env";

export interface ChannelDispatchRequest {
  communicationId: string;
  campaignId: string;
  customerId: string;
  recipient: string;
  channel: Channel;
  content: Prisma.JsonValue;
  attempt?: number;
}

export class ChannelServiceClient {
  async send(request: ChannelDispatchRequest): Promise<void> {
    const response = await fetch(`${env.CHANNEL_SERVICE_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Channel service send failed with status ${response.status}`);
    }
  }
}
