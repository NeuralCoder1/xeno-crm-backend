const callbackUrl = process.env.CRM_CALLBACK_URL;

if (!callbackUrl) {
  console.error("CRM_CALLBACK_URL is not set. Channel service cannot send callbacks.");
}

function stableHash(value) {
  return String(value)
    .split("")
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 100000, 7);
}

function shouldFail(message) {
  const fingerprint = `${message.communicationId}:${message.recipient}:${message.channel}`;
  return String(message.recipient).toLowerCase().includes("fail") || stableHash(fingerprint) % 13 === 0;
}

function lifecycleFor(message) {
  if (shouldFail(message)) {
    return ["sent", "failed"];
  }

  return ["sent", "delivered", "opened", "clicked"];
}

async function postEvent(message, status, index) {
  const timestamp = new Date(message.acceptedAt + index * 1000).toISOString();
  const eventId = `${message.communicationId}:attempt-${message.attempt}:${status}:${index}`;

  try {
    const response = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventId,
        communicationId: message.communicationId,
        status,
        timestamp,
        metadata: {
          campaignId: message.campaignId,
          customerId: message.customerId,
          channel: message.channel,
          attempt: message.attempt,
          source: "channel-service"
        }
      })
    });

    if (!response.ok && response.status !== 409) {
      console.error(`Channel callback failed with status ${response.status}`, {
        communicationId: message.communicationId,
        eventId,
        status
      });
    }
  } catch (error) {
    console.error("Failed to post channel callback", error);
  }
}

function scheduleLifecycleEvents(message) {
  const initialDelayMs = 1000 + (stableHash(message.communicationId) % 3) * 1000;
  const acceptedAt = Date.now() + initialDelayMs;
  const lifecycle = lifecycleFor(message);
  const scheduledMessage = {
    ...message,
    acceptedAt
  };

  lifecycle.forEach((status, index) => {
    setTimeout(() => {
      void postEvent(scheduledMessage, status, index);
    }, initialDelayMs + index * 700);
  });
}

module.exports = {
  scheduleLifecycleEvents
};
