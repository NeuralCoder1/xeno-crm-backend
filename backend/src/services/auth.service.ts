import jwt from "jsonwebtoken";
import { env } from "../config/env";

export class AuthService {
  createDemoToken(): string {
    return jwt.sign(
      {
        sub: "demo-user",
        email: "demo@xeno.ai",
        role: "admin"
      },
      env.JWT_SECRET
    );
  }
}
