import type { CustomerStatus, Prisma } from "@prisma/client";

export interface CreateCustomerInput {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  externalId?: string;
  status?: CustomerStatus;
  attributes?: Prisma.InputJsonValue;
  lifetimeValue?: number;
  totalSpend?: number;
  orderCount?: number;
  consent?: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
    rcs?: boolean;
  };
  source?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CustomerListQuery {
  search?: string;
  status?: CustomerStatus;
  page?: number;
  limit?: number;
}
