import { OrderStatus, PrismaClient, CustomerStatus } from "@prisma/client";

const prisma = new PrismaClient();

const firstNames = [
  "Aarav",
  "Asha",
  "Diya",
  "Ishaan",
  "Kabir",
  "Meera",
  "Neha",
  "Rohan",
  "Saanvi",
  "Vihaan"
];

const lastNames = [
  "Sharma",
  "Mehta",
  "Patel",
  "Rao",
  "Iyer",
  "Gupta",
  "Kapoor",
  "Nair",
  "Reddy",
  "Singh"
];

const cities = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"];
const loyaltyTiers = ["bronze", "silver", "gold", "platinum"];
const categories = ["Apparel", "Beauty", "Electronics", "Home", "Grocery", "Footwear"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomMoney(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function randomFrom<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function randomPastDate(maxDaysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, maxDaysAgo));
  date.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

async function main(): Promise<void> {
  const customers = [];

  for (let index = 1; index <= 500; index += 1) {
    const firstName = randomFrom(firstNames);
    const lastName = randomFrom(lastNames);
    const city = randomFrom(cities);
    const loyaltyTier = randomFrom(loyaltyTiers);
    const visitCount = randomInt(1, 85);

    customers.push({
      firstName,
      lastName,
      email: `customer${index}@example.com`,
      phone: `+9198${String(index).padStart(8, "0")}`,
      externalId: `seed_customer_${index}`,
      status: Math.random() < 0.84 ? CustomerStatus.active : CustomerStatus.inactive,
      attributes: {
        city,
        loyaltyTier,
        visitCount,
        preferredCategory: randomFrom(categories)
      },
      lifetimeValue: 0,
      orderCount: 0,
      lastOrderAt: null,
      consentEmail: Math.random() < 0.82,
      consentSms: Math.random() < 0.68,
      consentWhatsapp: Math.random() < 0.72,
      consentPush: Math.random() < 0.35,
      consentRcs: Math.random() < 0.28,
      consentUpdatedAt: randomPastDate(180),
      source: "seed"
    });
  }

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: {
        externalId: customer.externalId
      },
      create: customer,
      update: customer
    });
  }

  const seededCustomers = await prisma.customer.findMany({
    where: {
      source: "seed"
    },
    select: {
      id: true
    }
  });
  const aggregates = new Map<string, { lifetimeValue: number; orderCount: number; lastOrderAt: Date | null }>();
  const orders = [];

  await prisma.order.deleteMany({
    where: {
      externalOrderId: {
        startsWith: "seed_order_"
      }
    }
  });

  for (let index = 1; index <= 3000; index += 1) {
    const customer = randomFrom(seededCustomers);
    const quantity = randomInt(1, 5);
    const unitPrice = randomMoney(199, 8999);
    const subtotal = Number((quantity * unitPrice).toFixed(2));
    const discountTotal = Number((subtotal * randomMoney(0, 0.22)).toFixed(2));
    const taxTotal = Number(((subtotal - discountTotal) * 0.18).toFixed(2));
    const shippingTotal = randomMoney(0, 199);
    const grandTotal = Number((subtotal - discountTotal + taxTotal + shippingTotal).toFixed(2));
    const status = Math.random() < 0.7 ? OrderStatus.fulfilled : Math.random() < 0.88 ? OrderStatus.paid : randomFrom([OrderStatus.pending, OrderStatus.cancelled, OrderStatus.refunded]);
    const orderedAt = randomPastDate(365);

    orders.push({
      customerId: customer.id,
      externalOrderId: `seed_order_${index}`,
      status,
      currency: "INR",
      subtotal,
      discountTotal,
      taxTotal,
      shippingTotal,
      grandTotal,
      items: [
        {
          sku: `SKU-${randomInt(1000, 9999)}`,
          name: `${randomFrom(categories)} Item`,
          category: randomFrom(categories),
          quantity,
          unitPrice
        }
      ],
      orderedAt,
      metadata: {
        store: Math.random() < 0.78 ? "online" : "retail"
      }
    });

    if (status === OrderStatus.paid || status === OrderStatus.fulfilled) {
      const aggregate = aggregates.get(customer.id) ?? {
        lifetimeValue: 0,
        orderCount: 0,
        lastOrderAt: null
      };

      aggregate.lifetimeValue = Number((aggregate.lifetimeValue + grandTotal).toFixed(2));
      aggregate.orderCount += 1;
      aggregate.lastOrderAt = !aggregate.lastOrderAt || orderedAt > aggregate.lastOrderAt ? orderedAt : aggregate.lastOrderAt;
      aggregates.set(customer.id, aggregate);
    }
  }

  await prisma.order.createMany({
    data: orders
  });

  for (const customer of seededCustomers) {
    const aggregate = aggregates.get(customer.id) ?? {
      lifetimeValue: 0,
      orderCount: 0,
      lastOrderAt: null
    };

    await prisma.customer.update({
      where: { id: customer.id },
      data: aggregate
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
