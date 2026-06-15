import { prisma } from "../config/db";
import { CustomerStatus, type Customer, type Prisma } from "@prisma/client";
import type { CustomerListQuery } from "../types/customer";

export class CustomerRepository {
  create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return prisma.customer.create({
      data
    });
  }

  findById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { id }
    });
  }

  findAll(query: CustomerListQuery = {}): Promise<Customer[]> {
    const where: Prisma.CustomerWhereInput = {
      status: query.status ?? {
        not: CustomerStatus.deleted
      }
    };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } }
      ];
    }

    return prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
  }

  async findAllPaginated(query: CustomerListQuery = {}, page = 1, limit = 20): Promise<{ items: Customer[]; total: number }> {
    const where: Prisma.CustomerWhereInput = {
      status: query.status ?? {
        not: CustomerStatus.deleted
      }
    };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } }
      ];
    }

    const take = Math.min(limit ?? 20, 100);
    const skip = (Math.max(page ?? 1, 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.customer.count({ where })
    ]);

    return { items, total };
  }

  update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data
    });
  }

  softDelete(id: string): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data: {
        status: CustomerStatus.deleted
      }
    });
  }

  countByWhere(where: Prisma.CustomerWhereInput): Promise<number> {
    return prisma.customer.count({ where });
  }

  findByWhere(where: Prisma.CustomerWhereInput): Promise<Customer[]> {
    return prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
  }
}
