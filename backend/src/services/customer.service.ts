import { CustomerStatus, Prisma, type Customer } from "@prisma/client";
import { CustomerRepository } from "../repositories/customer.repository";
import type { CreateCustomerInput, CustomerListQuery, UpdateCustomerInput } from "../types/customer";
import { AppError } from "../utils/appError";

export class CustomerService {
  constructor(private readonly customerRepository = new CustomerRepository()) {}

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    try {
      return await this.customerRepository.create(this.toCustomerCreateData(input));
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  getCustomers(query: CustomerListQuery = {}): Promise<Customer[]> {
    return this.customerRepository.findAll(query);
  }

  async getCustomerById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new AppError("Customer not found.", 404, "CUSTOMER_NOT_FOUND");
    }

    return customer;
  }

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    await this.getCustomerById(id);

    try {
      return await this.customerRepository.update(id, this.toCustomerUpdateData(input));
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async deleteCustomer(id: string): Promise<Customer> {
    const customer = await this.getCustomerById(id);

    if (customer.status === CustomerStatus.deleted) {
      return customer;
    }

    return this.customerRepository.softDelete(id);
  }

  private toCustomerCreateData(input: CreateCustomerInput): Prisma.CustomerCreateInput {
    const derivedName = this.splitName(input.name);
    const consent = input.consent;

    return {
      firstName: input.firstName ?? derivedName.firstName,
      lastName: input.lastName ?? derivedName.lastName,
      email: input.email,
      phone: input.phone,
      externalId: input.externalId,
      status: input.status ?? CustomerStatus.active,
      attributes: input.attributes as Prisma.InputJsonValue | undefined,
      lifetimeValue: input.lifetimeValue ?? input.totalSpend ?? 0,
      orderCount: input.orderCount ?? 0,
      consentEmail: consent?.email ?? false,
      consentSms: consent?.sms ?? false,
      consentWhatsapp: consent?.whatsapp ?? false,
      consentPush: consent?.push ?? false,
      consentRcs: consent?.rcs ?? false,
      consentUpdatedAt: consent ? new Date() : undefined,
      source: input.source
    };
  }

  private toCustomerUpdateData(input: UpdateCustomerInput): Prisma.CustomerUpdateInput {
    const derivedName = this.splitName(input.name);
    const consent = input.consent;
    const data: Prisma.CustomerUpdateInput = {};

    if (input.firstName !== undefined || derivedName.firstName !== undefined) {
      data.firstName = input.firstName ?? derivedName.firstName;
    }

    if (input.lastName !== undefined || derivedName.lastName !== undefined) {
      data.lastName = input.lastName ?? derivedName.lastName;
    }

    if (input.email !== undefined) data.email = input.email;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.externalId !== undefined) data.externalId = input.externalId;
    if (input.status !== undefined) data.status = input.status;
    if (input.attributes !== undefined) data.attributes = input.attributes as Prisma.InputJsonValue;
    if (input.lifetimeValue !== undefined || input.totalSpend !== undefined) {
      data.lifetimeValue = input.lifetimeValue ?? input.totalSpend;
    }
    if (input.orderCount !== undefined) data.orderCount = input.orderCount;
    if (input.source !== undefined) data.source = input.source;

    if (consent) {
      if (consent.email !== undefined) data.consentEmail = consent.email;
      if (consent.sms !== undefined) data.consentSms = consent.sms;
      if (consent.whatsapp !== undefined) data.consentWhatsapp = consent.whatsapp;
      if (consent.push !== undefined) data.consentPush = consent.push;
      if (consent.rcs !== undefined) data.consentRcs = consent.rcs;
      data.consentUpdatedAt = new Date();
    }

    return data;
  }

  private splitName(name?: string): { firstName?: string; lastName?: string } {
    if (!name) {
      return {};
    }

    const [firstName, ...lastNameParts] = name.trim().split(/\s+/);

    return {
      firstName,
      lastName: lastNameParts.length > 0 ? lastNameParts.join(" ") : undefined
    };
  }

  private handleWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Customer with the same unique field already exists.", 409, "CUSTOMER_ALREADY_EXISTS", {
        target: error.meta?.target
      });
    }

    throw error;
  }
}
