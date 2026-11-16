import { Injectable } from "@nestjs/common";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProductsService } from "../../products/products.service";
import { CreateProductDto } from "../../products/dto/create-product.dto";
import { UpdateProductDto } from "../../products/dto/update-product.dto";
import { CreateColorsDto } from "../../products/dto/color.dto";
import { CreateVariantGroupDto } from "../../products/dto/create-variant-group.dto";
import { McpUserService } from "../mcp-user.service";
import { KeyCrmClient } from "../keycrm.client";
import { PrismaService } from "@libs/prisma-client";
import {
  dtoPayload,
  paginationShape,
  runTool,
  sortOrder,
  validateDto,
} from "../mcp.utils";

const productImageFields = "{ url: string (URL), order: number }";
const productSizeFields =
  "{ name: string, sku: string | null, quantity: number >= 0, isAvailable: boolean }";

@Injectable()
export class ProductsMcpTools {
  constructor(
    private readonly productsService: ProductsService,
    private readonly mcpUser: McpUserService,
    private readonly keyCrm: KeyCrmClient,
    private readonly prisma: PrismaService,
  ) {}

  register(server: McpServer, userId?: string) {
    server.registerTool(
      "list_products",
      {
        description:
          "List products with pagination, search by name, category filter and sorting.",
        inputSchema: {
          ...paginationShape,
          search: z
            .string()
            .optional()
            .describe("Case-insensitive name search"),
          categoryId: z.string().optional(),
          categoryAlias: z.string().optional(),
          sortBy: z
            .enum(["createdAt", "updatedAt", "name", "alias", "top", "price"])
            .optional(),
          sortOrder: sortOrder.optional().describe("Defaults to desc"),
        },
        annotations: { readOnlyHint: true },
      },
      ({ take, skip, search, categoryId, categoryAlias, sortBy, sortOrder }) =>
        runTool(() =>
          this.productsService.findAll({
            take,
            skip,
            where: {
              name: { contains: search, mode: "insensitive" },
              categoryId: categoryId || undefined,
              category: { alias: categoryAlias || undefined },
            },
            orderBy: sortBy ? [{ [sortBy]: sortOrder ?? "desc" }] : undefined,
          }),
        ),
    );

    server.registerTool(
      "get_product",
      {
        description: "Get a single product by id or alias.",
        inputSchema: {
          id: z.string().optional(),
          alias: z.string().optional(),
        },
        annotations: { readOnlyHint: true },
      },
      ({ id, alias }) =>
        runTool(async () => {
          if (!id && !alias) throw new Error("Pass either id or alias");
          return this.productsService.findOne({
            where: id ? { id } : { alias },
          });
        }),
    );

    server.registerTool(
      "get_crm_product",
      {
        description:
          "Fetch the KeyCRM version of a shop product (by shop product id or alias) " +
          "using its partner's CRM. Returns CRM name, description, image URLs, quantity and prices; " +
          "use update_product to copy them into the shop.",
        inputSchema: {
          id: z.string().optional().describe("Shop product id"),
          alias: z.string().optional(),
        },
        annotations: { readOnlyHint: true },
      },
      ({ id, alias }) =>
        runTool(async () => {
          if (!id && !alias) throw new Error("Pass either id or alias");
          const productId =
            id ?? (await this.productsService.findOne({ where: { alias } })).id;
          const crmProduct = await this.productsService.getProductFromCrm({
            id: productId,
          });
          return {
            keyCrmId: crmProduct.id,
            name: crmProduct.name,
            description: crmProduct.description,
            images: crmProduct.attachments_data,
            quantity: crmProduct.quantity,
            minPrice: crmProduct.min_price,
            maxPrice: crmProduct.max_price,
          };
        }),
    );

    server.registerTool(
      "update_crm_product",
      {
        description:
          "Change a product both in its partner's KeyCRM and in the shop (by shop product id or alias). " +
          "price sets the CRM product price, the price of every CRM variant (size) and the shop price; " +
          "the shop discount is kept, so the shop sale price follows it. " +
          "images replaces the whole photo set in both places, in the given order.",
        inputSchema: {
          id: z.string().optional().describe("Shop product id"),
          alias: z.string().optional(),
          name: z.string().min(1).optional(),
          description: z.string().min(1).optional(),
          price: z.number().positive().optional(),
          images: z.array(z.string().url()).min(1).optional(),
        },
        annotations: { destructiveHint: false, idempotentHint: true },
      },
      ({ id, alias, name, description, price, images }) =>
        runTool(async () => {
          if (!id && !alias) throw new Error("Pass either id or alias");
          if (
            [name, description, price, images].every((v) => v === undefined)
          ) {
            throw new Error(
              "Pass at least one of name, description, price, images",
            );
          }
          const product = await this.productsService.findOne({
            where: id ? { id } : { alias },
          });
          if (!product.keyCrmId) {
            throw new Error(`Product ${product.id} is not linked to KeyCRM`);
          }
          const partner = await this.keyCrm.partner(product.partnersId);

          await this.keyCrm.request(
            partner,
            "PUT",
            `/products/${product.keyCrmId}`,
            {
              name,
              description,
              price,
              pictures: images,
            },
          );
          let updatedOffers = 0;
          if (price !== undefined) {
            const offers = await this.keyCrm.listAll<{ id: number }>(
              partner,
              `/offers?filter[product_id]=${product.keyCrmId}`,
            );
            if (offers.length) {
              await this.keyCrm.request(partner, "PUT", "/offers", {
                offers: offers.map((offer) => ({ id: offer.id, price })),
              });
            }
            updatedOffers = offers.length;
          }

          try {
            const shopProduct = await this.productsService.update({
              where: { id: product.id },
              data: await validateDto(UpdateProductDto, {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(price !== undefined && { price }),
                ...(images && {
                  images: images.map((url, order) => ({ url, order })),
                }),
              }),
            });
            return {
              crm: {
                partner: partner.name,
                keyCrmId: product.keyCrmId,
                updatedOffers,
              },
              shop: {
                id: shopProduct.id,
                name: shopProduct.name,
                price: shopProduct.price,
                discount: shopProduct.discount,
                images: shopProduct.images.length,
              },
            };
          } catch (error) {
            throw new Error(
              `KeyCRM was updated, but the shop product was not: ${(error as Error).message}`,
            );
          }
        }),
    );

    server.registerTool(
      "sync_skus_from_crm",
      {
        description:
          "Fill missing SKUs (артикул) of shop products and their sizes from KeyCRM. " +
          "Without ids/aliases it takes every shop product linked to KeyCRM that has an empty product or size SKU. " +
          "Sizes are matched by KeyCRM offer id, then by size name. Existing SKUs are kept unless overwrite is true. " +
          "Use dryRun to preview.",
        inputSchema: {
          ids: z.array(z.string()).optional().describe("Shop product ids"),
          aliases: z.array(z.string()).optional(),
          partnerId: z
            .string()
            .optional()
            .describe("Only this partner's products"),
          overwrite: z
            .boolean()
            .optional()
            .describe("Replace SKUs that differ from KeyCRM (default false)"),
          dryRun: z.boolean().optional().describe("Only report changes"),
          limit: z
            .number()
            .int()
            .min(1)
            .max(500)
            .optional()
            .describe("Default 200"),
        },
        annotations: { destructiveHint: false, idempotentHint: true },
      },
      (params) => runTool(() => this.syncSkus(params)),
    );

    server.registerTool(
      "create_product",
      {
        description:
          "Create a product (optionally also in KeyCRM via isCreateOnCrm).",
        inputSchema: {
          data: dtoPayload(
            `name, description, alias (string), price (number), categoryId (string), quantity (number), ` +
              `images: ${productImageFields}[], discount (0-100), top (boolean), isCreateOnCrm (boolean), ` +
              `productSizes?: ${productSizeFields}[]`,
          ),
        },
      },
      ({ data }) =>
        runTool(async () =>
          this.productsService.create({
            data: await validateDto(CreateProductDto, data),
            user: await this.mcpUser.getActingUser(userId),
          }),
        ),
    );

    server.registerTool(
      "update_product",
      {
        description:
          "Partially update a product, including hiding it from the shop (hidden: true) or showing it again (hidden: false). " +
          "Images/sizes with an id are updated, without id are created.",
        inputSchema: {
          id: z.string().describe("Product id"),
          data: dtoPayload(
            `all optional: name, description, alias, price, categoryId, quantity, discount, top, isNovelty, hidden (boolean), ` +
              `images: (${productImageFields} + id?)[], productSizes: (${productSizeFields} + id?)[], ` +
              `variantGroupId, groupId, colorId (cuid | null)`,
          ),
        },
      },
      ({ id, data }) =>
        runTool(async () =>
          this.productsService.update({
            where: { id },
            data: await validateDto(UpdateProductDto, data),
          }),
        ),
    );

    server.registerTool(
      "delete_product",
      {
        description: "Delete a product by id.",
        inputSchema: { id: z.string() },
        annotations: { destructiveHint: true },
      },
      ({ id }) =>
        runTool(async () =>
          this.productsService.remove({
            where: { id },
            user: await this.mcpUser.getActingUser(userId),
          }),
        ),
    );

    server.registerTool(
      "list_colors",
      {
        description: "List all product colors.",
        annotations: { readOnlyHint: true },
      },
      () => runTool(() => this.productsService.findAllColors()),
    );

    server.registerTool(
      "create_colors",
      {
        description: "Create colors in batch.",
        inputSchema: {
          colors: z
            .array(z.object({ name: z.string(), hex: z.string() }))
            .min(1),
        },
      },
      (data) =>
        runTool(async () =>
          this.productsService.createColors(
            await validateDto(CreateColorsDto, data),
          ),
        ),
    );

    server.registerTool(
      "list_variant_groups",
      {
        description: "List product variant groups.",
        inputSchema: {
          ...paginationShape,
          search: z.string().optional(),
        },
        annotations: { readOnlyHint: true },
      },
      ({ take, skip, search }) =>
        runTool(() =>
          this.productsService.findAllVariantGroups({
            take,
            skip,
            searchString: search,
          }),
        ),
    );

    server.registerTool(
      "create_variant_group",
      {
        description: "Create a variant group and optionally attach products.",
        inputSchema: {
          name: z.string().optional(),
          productIds: z.array(z.string()).optional(),
        },
      },
      (data) =>
        runTool(async () =>
          this.productsService.createVariantGroup(
            await validateDto(CreateVariantGroupDto, data),
          ),
        ),
    );
  }

  private async syncSkus(params: {
    ids?: string[];
    aliases?: string[];
    partnerId?: string;
    overwrite?: boolean;
    dryRun?: boolean;
    limit?: number;
  }) {
    const {
      ids,
      aliases,
      partnerId,
      overwrite = false,
      dryRun = false,
    } = params;
    const emptySku = [{ sku: null }, { sku: "" }];
    const products = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        keyCrmId: { not: null },
        partnersId: partnerId ? partnerId : { not: null },
        ...(!!(ids?.length || aliases?.length) && {
          OR: [
            ...(ids?.length ? [{ id: { in: ids } }] : []),
            ...(aliases?.length ? [{ alias: { in: aliases } }] : []),
          ],
        }),
        ...(!overwrite &&
          !ids?.length &&
          !aliases?.length && {
            AND: [
              {
                OR: [...emptySku, { productSizes: { some: { OR: emptySku } } }],
              },
            ],
          }),
      },
      select: {
        id: true,
        name: true,
        alias: true,
        sku: true,
        keyCrmId: true,
        partnersId: true,
        productSizes: {
          select: { id: true, name: true, sku: true, keyCrmId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 200,
    });

    const byPartner = new Map<string, typeof products>();
    for (const product of products) {
      const list = byPartner.get(product.partnersId) ?? [];
      list.push(product);
      byPartner.set(product.partnersId, list);
    }

    const updated: unknown[] = [];
    const notInCrm: { alias: string; keyCrmId: number }[] = [];
    let unchanged = 0;

    for (const [pid, partnerProducts] of byPartner) {
      const partner = await this.keyCrm.partner(pid);
      const crmProducts = new Map<number, { id: number; sku: string | null }>();
      const crmOffers = new Map<
        number,
        { id: number; sku: string | null; properties?: { value: string }[] }[]
      >();

      for (let i = 0; i < partnerProducts.length; i += SKU_BATCH) {
        const keyCrmIds = partnerProducts
          .slice(i, i + SKU_BATCH)
          .map((p) => p.keyCrmId);
        const filter = keyCrmIds.join(",");
        const [crmList, offers] = await Promise.all([
          this.keyCrm.listAll<{ id: number; sku: string | null }>(
            partner,
            `/products?filter[product_id]=${filter}`,
          ),
          this.keyCrm.listAll<{
            id: number;
            product_id: number;
            sku: string | null;
            properties?: { value: string }[];
          }>(partner, `/offers?filter[product_id]=${filter}`),
        ]);
        const wanted = new Set(keyCrmIds);
        for (const item of crmList) {
          if (wanted.has(item.id)) crmProducts.set(item.id, item);
        }
        for (const offer of offers) {
          if (!wanted.has(offer.product_id)) continue;
          const list = crmOffers.get(offer.product_id) ?? [];
          list.push(offer);
          crmOffers.set(offer.product_id, list);
        }
        // The list filter may be ignored by KeyCRM; fetch the rest one by one.
        for (const keyCrmId of keyCrmIds) {
          if (crmProducts.has(keyCrmId)) continue;
          try {
            crmProducts.set(
              keyCrmId,
              await this.keyCrm.request(
                partner,
                "GET",
                `/products/${keyCrmId}`,
              ),
            );
          } catch {
            // reported as notInCrm below
          }
        }
      }

      for (const product of partnerProducts) {
        const crmProduct = crmProducts.get(product.keyCrmId);
        if (!crmProduct) {
          notInCrm.push({ alias: product.alias, keyCrmId: product.keyCrmId });
          continue;
        }
        const shouldSet = (current: string | null, next: string | null) =>
          !!next?.trim() &&
          current !== next.trim() &&
          (overwrite || !current?.trim());

        const productSku = shouldSet(product.sku, crmProduct.sku)
          ? crmProduct.sku.trim()
          : undefined;
        const offers = crmOffers.get(product.keyCrmId) ?? [];
        const sizeChanges = product.productSizes.flatMap((size) => {
          const offer =
            offers.find((o) => o.id === size.keyCrmId) ??
            offers.find(
              (o) =>
                o.properties?.[0]?.value?.trim().toLowerCase() ===
                size.name.trim().toLowerCase(),
            );
          return offer && shouldSet(size.sku, offer.sku)
            ? [
                {
                  id: size.id,
                  name: size.name,
                  from: size.sku,
                  sku: offer.sku.trim(),
                },
              ]
            : [];
        });

        if (productSku === undefined && !sizeChanges.length) {
          unchanged++;
          continue;
        }
        if (!dryRun) {
          await this.prisma.$transaction([
            ...(productSku !== undefined
              ? [
                  this.prisma.product.update({
                    where: { id: product.id },
                    data: { sku: productSku },
                  }),
                ]
              : []),
            ...sizeChanges.map((change) =>
              this.prisma.productSize.update({
                where: { id: change.id },
                data: { sku: change.sku },
              }),
            ),
          ]);
        }
        updated.push({
          name: product.name,
          alias: product.alias,
          ...(productSku !== undefined && {
            sku: { from: product.sku, to: productSku },
          }),
          sizes: sizeChanges.map(({ name, from, sku }) => ({
            name,
            from,
            to: sku,
          })),
        });
      }
    }

    return {
      dryRun,
      checked: products.length,
      updated: updated.length,
      unchanged,
      notInCrm,
      changes: updated,
    };
  }
}

const SKU_BATCH = 50;
