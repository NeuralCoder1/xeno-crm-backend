import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import audienceRoutes from "./routes/audience.routes";
import callbackRoutes from "./routes/callbacks.routes";
import campaignRoutes from "./routes/campaigns.routes";
import communicationLogRoutes from "./routes/communicationLogs.routes";
import customerRoutes from "./routes/customers.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import healthRoutes from "./routes/health.routes";
import aiRoutes from "./routes/ai.routes";
import orderRoutes from "./routes/orders.routes";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { requestId } from "./middleware/requestId";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestId);
app.use(requestLogger);

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/callbacks", callbackRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/communication-logs", communicationLogRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/audience", audienceRoutes);
app.use("/api/segments", audienceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

// API v1 aliases
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/callbacks", callbackRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/communication-logs", communicationLogRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/audience", audienceRoutes);
app.use("/api/v1/segments", audienceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/ai", aiRoutes);

app.use(errorHandler);
