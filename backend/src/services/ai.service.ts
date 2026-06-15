import { AIRepository } from "../repositories/ai.repository";
import type { AudienceRuleGroup } from "../types/segment";

export class AIService {
  constructor(private readonly aiRepository = new AIRepository()) {}

  private ruleBasedSegment(prompt: string): AudienceRuleGroup {
    const text = prompt.toLowerCase();
    const conditions: any[] = [];

    if (text.includes("mumbai")) {
      conditions.push({ field: "customer.attributes.city", operator: "eq", value: "Mumbai" });
    }

    if (text.includes("high value") || text.includes("high-value") || text.includes("highvalue")) {
      conditions.push({ field: "customer.lifetimeValue", operator: "gt", value: 1000 });
    }

    if (conditions.length === 0) {
      // default: active customers
      conditions.push({ field: "customer.status", operator: "eq", value: "active" });
    }

    return { operator: "and", conditions };
  }

  async generateSegment(prompt: string) {
    const rules = this.ruleBasedSegment(prompt);

    const session = await this.aiRepository.createAISession({
      userPrompt: prompt,
      generatedSegment: rules as any
    });

    return { rules, session };
  }

  async generateMessage(campaignType: string, objective: string) {
    const subject = `${objective} - ${campaignType}`;
    const body = `Hello,\n\nWe are excited to announce ${objective}. Enjoy exclusive offers!\n\nRegards`;

    const message = { subject, body };

    const session = await this.aiRepository.createAISession({
      userPrompt: `${campaignType} ${objective}`,
      generatedMessage: message as any
    });

    return { message, session };
  }

  async recommendChannel(campaignType: string, audienceSize: number) {
    let channel = "email";
    let reason = "Broad reach and lower cost";

    if (campaignType === "transactional") {
      channel = "sms";
      reason = "Time-sensitive transactional messages perform well on SMS";
    } else if (audienceSize < 200) {
      channel = "whatsapp";
      reason = "Smaller audiences perform well with WhatsApp engagement";
    }

    const session = await this.aiRepository.createAISession({
      userPrompt: `${campaignType} ${audienceSize}`,
      recommendedChannel: channel as any
    });

    return { channel, reason, session };
  }

  async copilot(prompt: string) {
    const segmentRes = await this.generateSegment(prompt);
    const messageRes = await this.generateMessage("promotional", prompt);
    const channelRes = await this.recommendChannel("promotional", 1000);

    const combined = {
      segment: segmentRes.rules,
      message: messageRes.message,
      channel: channelRes.channel
    };

    await this.aiRepository.createAISession({
      userPrompt: prompt,
      generatedSegment: segmentRes.rules as any,
      generatedMessage: messageRes.message as any,
      recommendedChannel: channelRes.channel as any
    });

    return combined;
  }
}

export default AIService;
