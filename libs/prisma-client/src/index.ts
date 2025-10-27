export * from "./lib/prisma.module";
export * from "./lib/prisma.service";
export {
  PrismaClient,
  Prisma,
  User,
  Order,
  Product,
  ProductImage,
  UserSession,
  ProductSize,
  Category,
  OrderProduct,
  ServerStatus,
  Role,
  Brands,
  Partners,
} from "./generated/client";
