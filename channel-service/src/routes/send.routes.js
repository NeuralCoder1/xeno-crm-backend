const { Router } = require("express");
const { scheduleLifecycleEvents } = require("../services/deliverySimulator");

const router = Router();

router.post("/send", (req, res) => {
  const { communicationId, campaignId, customerId, recipient, channel, content, attempt } = req.body;

  if (!communicationId || !campaignId || !customerId || !recipient || !channel || content === undefined) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "communicationId, campaignId, customerId, recipient, channel and content are required."
      }
    });
  }

  scheduleLifecycleEvents({
    communicationId,
    campaignId,
    customerId,
    recipient,
    channel,
    content,
    attempt: Number.isInteger(attempt) && attempt >= 0 ? attempt : 0
  });

  return res.status(202).json({
    success: true,
    data: {
      accepted: true,
      communicationId
    }
  });
});

module.exports = router;
