// // prisma/seed.ts
//
// import { Prisma, PrismaClient } from "@libs/prisma-client";
// import { transliteration } from "../../../apps/admin/src/utils/transliteration.util";
// import { hashPassword } from "../../../apps/admin/src/utils/bcrypt.util";
//
// type TSize = {
//   keyCrmId: number;
//   name: string;
//   quantity: number;
//   isAvailable: boolean;
//   sku: string;
// };
//
// type TCategory = {
//   id: number;
//   name: string;
//   parent_id: number | null;
// };
//
// type TProduct = {
//   id: number;
//   name: string;
//   description: string | null;
//   thumbnail_url: string;
//   attachments_data: string[];
//   quantity: number;
//   unit_type: string | null;
//   in_reserve: number;
//   currency_code: string;
//   min_price: number;
//   max_price: number;
//   weight: number;
//   length: number;
//   height: number;
//   width: number;
//   has_offers: boolean;
//   is_archived: boolean;
//   category_id: number;
//   created_at: string;
//   updated_at: string;
//   sku: string | null;
//   barcode: string | null;
//   price: number;
//   purchased_price: number;
//   sources: any[];
// };
//
// type TOffer = {
//   id: number;
//   product_id: number;
//   sku: string;
//   barcode: string | null;
//   thumbnail_url: string | null;
//   price: number;
//   purchased_price: number;
//   quantity: number;
//   in_reserve: number;
//   weight: number | null;
//   length: number | null;
//   height: number | null;
//   width: number | null;
//   properties: Array<{
//     name: string;
//     value: string;
//   }>;
//   is_default: boolean;
//   is_archived: boolean;
//   created_at: string;
//   updated_at: string;
// };
//
// type TResponse<T> = {
//   data: T[];
//   total: number;
// };
//
// // initialize Prisma Client
// const prisma = new PrismaClient();
// const urlKeyCrm = process.env.CRM_API_URL;
// const secretKey = process.env.CRM_API_KEY;
//
// async function getProductSizes(params: {
//   productId: number;
// }): Promise<TSize[]> {
//   const response = await fetch(
//     `${urlKeyCrm}/offers?filter[product_id]=${params.productId}`,
//     {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${secretKey}`,
//       },
//     },
//   );
//   const offers: TResponse<TOffer> = await response.json();
//   return offers.data
//     .map((offer) => ({
//       keyCrmId: offer.id,
//       name:
//         offer?.properties.length <= 0 ? "default" : offer.properties[0].value,
//       quantity: offer.quantity,
//       isAvailable: true,
//       sku: offer.sku,
//     }))
//     .filter((size) => size.name !== "default");
// }
// async function seedCategories() {
//   const response = await fetch(
//     `${urlKeyCrm}/products/categories?limit=100&page=1`,
//     {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${secretKey}`,
//       },
//     },
//   );
//   const categories: TResponse<TCategory> = await response.json();
//   const filterCategoriesWithoutParent = categories.data.reduce<{
//     parent: TCategory[];
//     child: TCategory[];
//   }>(
//     (acc, category) => {
//       if (category.id === 45)
//         return {
//           ...acc,
//         };
//       if (!category.parent_id) {
//         return {
//           ...acc,
//           parent: [...acc.parent, category],
//         };
//       }
//       return {
//         ...acc,
//         child: [...acc.child, category],
//       };
//     },
//     {
//       parent: [],
//       child: [],
//     },
//   );
//   let i = 0;
//   let j = 0;
//   for (const category of filterCategoriesWithoutParent.parent) {
//     const parentCategory = await prisma.category.create({
//       data: {
//         name: category.name,
//         alias: transliteration(category.name),
//         description: "string",
//         keyCrmId: category.id,
//         imageUrl: "",
//       },
//     });
//     console.log(i, ". create parent category: ", parentCategory);
//     const childCategoriesByParentId =
//       filterCategoriesWithoutParent.child.filter(
//         (child) => child.parent_id === category.id,
//       );
//     for (const childCategory of childCategoriesByParentId) {
//       const createCategory = await prisma.category.create({
//         data: {
//           name: childCategory.name,
//           alias: transliteration(childCategory.name),
//           description: "string",
//           keyCrmId: childCategory.id,
//           imageUrl: "",
//           parentCategoryId: parentCategory.id,
//         },
//       });
//       console.log(j, ". create child category: ", createCategory);
//       j++;
//     }
//     i++;
//   }
// }
// async function seedProducts() {
//   const products: TProduct[] = [];
//   let totalCount = 0;
//   let perPage = 50;
//   let countCycles = 0;
//   do {
//     const response = await fetch(
//       `${urlKeyCrm}/products/?limit=${perPage}&page=${countCycles + 1}`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${secretKey}`,
//         },
//       },
//     );
//     const result: TResponse<TProduct> = await response.json();
//     if (products.length === 0 && totalCount === 0) {
//       totalCount = result.total;
//       console.log(totalCount);
//       console.log("total products: ", totalCount);
//     }
//     totalCount -= perPage;
//     countCycles += 1;
//     products.push(...result.data);
//   } while (totalCount > 0);
//   console.log("Total cycle: ", countCycles);
//   let i = 0;
//   for (const product of products) {
//     if (i === 100) {
//       setTimeout(() => {
//         console.log("timeout");
//       }, 5000);
//     }
//     if (product.category_id === 45) {
//       continue;
//     }
//     const category = await prisma.category.findFirst({
//       where: {
//         keyCrmId: product.category_id || 1,
//       },
//     });
//     if (!category) {
//       console.log(
//         `Category with keyCrmId: ${product.category_id} not found in the database`,
//       );
//       continue;
//     }
//     const productExist = await prisma.product.findFirst({
//       where: {
//         keyCrmId: product.id,
//       },
//     });
//     if (productExist) {
//       console.log(
//         `Product with keyCrmId: ${product.id} already exists in the database`,
//       );
//       continue;
//     }
//     const sizes = await getProductSizes({ productId: product.id });
//     const createProduct = await prisma.product.create({
//       data: {
//         name: product.name,
//         description: product.description,
//         price: product.max_price,
//         alias: transliteration(product.name),
//         quantity: product.quantity,
//         createdAt: new Date(product.created_at),
//         updatedAt: new Date(product.updated_at),
//         hidden: product.is_archived,
//         keyCrmId: product.id,
//         category: {
//           connect: {
//             id: category.id,
//           },
//         },
//         images: {
//           create: product.attachments_data.map((attachment, index) => ({
//             url: attachment,
//             order: index,
//           })),
//         },
//         productSizes: {
//           create: sizes,
//         },
//         discount: 0,
//       },
//     });
//
//     console.log(i, ". create product: ", createProduct);
//     i++;
//   }
// }
//
// async function seedRoles() {
//   const roles = [
//     {
//       name: "admin",
//     },
//     {
//       name: "super-admin",
//     },
//     {
//       name: "manager",
//     },
//   ];
//   for (const role of roles) {
//     const roleExist = await prisma.role.findFirst({
//       where: {
//         name: role.name,
//       },
//     });
//     if (roleExist) {
//       console.log(`Role ${role.name} already exists in the database`);
//       continue;
//     }
//     const createRole = await prisma.role.create({
//       data: {
//         name: role.name,
//       },
//     });
//     console.log("create role: ", createRole);
//   }
// }
//
// async function seedUsers() {
//   const roles = await prisma.role.findMany();
//   if (roles.length <= 0) {
//     console.log("Roles not found in the database");
//     return;
//   }
//   const users: Prisma.UserCreateInput[] = [
//     {
//       email: "admin@admin.com",
//       password: await hashPassword("qwerty123"),
//       firstName: "Admin",
//       lastName: "Admin",
//       role: {
//         connect: {
//           id: roles.find((role) => role.name === "admin")?.id,
//         },
//       },
//     },
//     {
//       email: "super-admin@admin.com",
//       password: await hashPassword("qwerty123"),
//       firstName: "Super",
//       lastName: "Admin",
//       role: {
//         connect: {
//           id: roles.find((role) => role.name === "admin")?.id,
//         },
//       },
//     },
//   ];
//   for (const user of users) {
//     const userExist = await prisma.user.findFirst({
//       where: {
//         email: user.email,
//       },
//     });
//     if (userExist) {
//       console.log(`User ${user.email} already exists in the database`);
//       continue;
//     }
//     const createUser = await prisma.user.create({
//       data: user,
//     });
//     console.log("create user: ", createUser);
//   }
// }
// async function seedOrderStatuses() {
//   const orderStatuses = [
//     {
//       name: "new",
//     },
//     {
//       name: "in-progress",
//     },
//     {
//       name: "completed",
//     },
//     {
//       name: "canceled",
//     },
//   ];
//   for (const status of orderStatuses) {
//     const statusExist = await prisma.orderStatus.findFirst({
//       where: {
//         name: status.name,
//       },
//     });
//     if (statusExist) {
//       console.log(`Order status ${status.name} already exists in the database`);
//       continue;
//     }
//     const createStatus = await prisma.orderStatus.create({
//       data: {
//         name: status.name,
//       },
//     });
//     console.log("create order status: ", createStatus);
//   }
// }
//
// async function main() {
//   await seedCategories();
//   await seedProducts();
//   await seedRoles();
//   await seedUsers();
//   await seedOrderStatuses();
// }
//
// // execute the main function
// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     // close Prisma Client at the end
//     await prisma.$disconnect();
//   });
