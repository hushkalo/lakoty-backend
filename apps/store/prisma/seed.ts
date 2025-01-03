// // prisma/seed.ts
//
// import { PrismaClient } from "@prisma/client";
// import * as process from "node:process";
// import { transliteration } from "../src/utils/transliteration.util";
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
// };
//
// // initialize Prisma Client
// const prisma = new PrismaClient();
// const urlKeyCrm = process.env.URL_KEYCRM;
// const secretKey = process.env.API_KEY_KEYCRM;
//
// async function getProductSizes(params: {
//   productId: number;
// }): Promise<TSize[]> {
//   const response = await fetch(
//     `${urlKeyCrm}offers?filter[product_id]=${params.productId}`,
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
// // async function seedCategories() {
// //   const response = await fetch(
// //     `${urlKeyCrm}products/categories?limit=100&page=1`,
// //     {
// //       method: "GET",
// //       headers: {
// //         "Content-Type": "application/json",
// //         Authorization: `Bearer ${secretKey}`,
// //       },
// //     },
// //   );
// //   const categories: TResponse<TCategory> = await response.json();
// //   const filterCategoriesWithoutParent = categories.data.reduce<{
// //     parent: TCategory[];
// //     child: TCategory[];
// //   }>(
// //     (acc, category) => {
// //       if (!category.parent_id) {
// //         return {
// //           ...acc,
// //           parent: [...acc.parent, category],
// //         };
// //       }
// //       return {
// //         ...acc,
// //         child: [...acc.child, category],
// //       };
// //     },
// //     {
// //       parent: [],
// //       child: [],
// //     },
// //   );
// //   let i = 0;
// //   let j = 0;
// //   for (const category of filterCategoriesWithoutParent.parent) {
// //     const parentCategory = await prisma.category.create({
// //       data: {
// //         name: category.name,
// //         alias: transliteration(category.name),
// //         description: "string",
// //         keyCrmId: category.id,
// //         imageUrl: "",
// //       },
// //     });
// //     console.log(i, ". create parent category: ", parentCategory);
// //     const childCategoriesByParentId =
// //       filterCategoriesWithoutParent.child.filter(
// //         (child) => child.parent_id === category.id,
// //       );
// //     for (const childCategory of childCategoriesByParentId) {
// //       const createCategory = await prisma.category.create({
// //         data: {
// //           name: childCategory.name,
// //           alias: transliteration(childCategory.name),
// //           description: "string",
// //           keyCrmId: childCategory.id,
// //           imageUrl: "",
// //           parentCategoryId: parentCategory.id,
// //         },
// //       });
// //       console.log(j, ". create child category: ", createCategory);
// //       j++;
// //     }
// //     i++;
// //   }
// // }
// // async function seedProducts() {
// //   const response = await fetch(`${urlKeyCrm}products/?limit=1000&page=1`, {
// //     method: "GET",
// //     headers: {
// //       "Content-Type": "application/json",
// //       Authorization: `Bearer ${secretKey}`,
// //     },
// //   });
// //   const products: TResponse<TProduct> = await response.json();
// //   let i = 0;
// //   for (const product of products.data) {
// //     const category = await prisma.category.findFirst({
// //       where: {
// //         keyCrmId: product.category_id || 1,
// //       },
// //     });
// //     if (!category) {
// //       console.log(
// //         `Category with keyCrmId: ${product.category_id} not found in the database`,
// //       );
// //       continue;
// //     }
// //     const productExist = await prisma.product.findFirst({
// //       where: {
// //         keyCrmId: product.id,
// //       },
// //     });
// //     if (productExist) {
// //       console.log(
// //         `Product with keyCrmId: ${product.id} already exists in the database`,
// //       );
// //       continue;
// //     }
// //     const sizes = await getProductSizes({ productId: product.id });
// //     const createProduct = await prisma.product.create({
// //       data: {
// //         name: product.name,
// //         description: product.description,
// //         price: product.max_price,
// //         alias: transliteration(product.name),
// //         quantity: product.quantity,
// //         createdAt: new Date(product.created_at),
// //         updatedAt: new Date(product.updated_at),
// //         keyCrmId: product.id,
// //         category: {
// //           connect: {
// //             id: category.id,
// //           },
// //         },
// //         images: {
// //           create: product.attachments_data.map((attachment) => ({
// //             url: attachment,
// //           })),
// //         },
// //         productSizes: {
// //           create: sizes,
// //         },
// //         discount: 0,
// //       },
// //     });
// //
// //     console.log(i, ". create product: ", createProduct);
// //     i++;
// //   }
// // }
//
// async function main() {
//   // await seedCategories();
//   // await seedProducts();
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
