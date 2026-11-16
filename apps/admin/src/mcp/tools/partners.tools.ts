import { Injectable } from "@nestjs/common";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PartnerService } from "../../partners/partner.service";
import { CreatePartnerDto } from "../../partners/dto/create-partner.dto";
import { UpdatePartnerDto } from "../../partners/dto/update-partner.dto";
import { KeyCrmClient } from "../keycrm.client";
import { PrismaService } from "@libs/prisma-client";
import {
  type TCategory,
  type TOffer,
  type TProduct,
} from "../../partners/dto/partner-api.dto";
import { transliteration } from "../../utils/transliteration.util";

/** Same exclusion as the admin "upload products" import. */
const EXCLUDED_CRM_CATEGORIES = [45];
const IMPORT_MAX_PAGES = 200;

const aliasBase = (name: string) => transliteration(name) || "product";
import {
  dtoPayload,
  paginationShape,
  runTool,
  sortOrder,
  validateDto,
} from "../mcp.utils";

type CrmOption = { id: number; name: string };

/** Partner fields holding KeyCRM ids, and where KeyCRM lists their possible values. */
const CRM_SETTINGS = {
  deliveryService: {
    field: "deliveryServiceId",
    path: "/order/delivery-service",
    label: "delivery service (who ships the order)",
  },
  prePaymentMethod: {
    field: "prePayId",
    path: "/order/payment-method",
    label: "payment method for prepaid orders",
  },
  postPaymentMethod: {
    field: "postPayId",
    path: "/order/payment-method",
    label: "payment method for cash-on-delivery orders",
  },
  source: { field: "sourceId", path: "/order/source", label: "order source" },
  manager: { field: "managerId", path: "/users", label: "order manager" },
} as const;

type CrmSetting = keyof typeof CRM_SETTINGS;

const crmValue = z
  .union([z.number().int().positive(), z.string().min(1)])
  .optional();

const optionName = (item: { name?: string; full_name?: string }) =>
  item.name ?? item.full_name ?? "";

/** Finds an option by id, exact name or a unique case-insensitive name fragment. */
function resolveOption(
  label: string,
  options: CrmOption[],
  value: number | string,
): CrmOption {
  const list = (items: CrmOption[]) =>
    items.map((o) => `${o.name} (${o.id})`).join(", ");
  if (typeof value === "number") {
    const option = options.find((o) => o.id === value);
    if (!option) {
      throw new Error(
        `No ${label} with id ${value}. Available: ${list(options)}`,
      );
    }
    return option;
  }
  const needle = value.trim().toLowerCase();
  const exact = options.filter((o) => o.name.trim().toLowerCase() === needle);
  const matches = exact.length
    ? exact
    : options.filter((o) => o.name.toLowerCase().includes(needle));
  if (matches.length === 1) return matches[0];
  throw new Error(
    matches.length
      ? `"${value}" matches several ${label} options: ${list(matches)}`
      : `No ${label} named "${value}". Available: ${list(options)}`,
  );
}

const partnerFields =
  "name (3-50 chars), apiKey, apiUrl (URL), managerId, sourceId, postPayId, prePayId, deliveryServiceId (positive numbers), " +
  "isUpdate? (boolean), instagram? (URL), telegram? (URL), phone?";

@Injectable()
export class PartnersMcpTools {
  constructor(
    private readonly partnerService: PartnerService,
    private readonly keyCrm: KeyCrmClient,
    private readonly prisma: PrismaService,
  ) {}

  register(server: McpServer) {
    server.registerTool(
      "list_partners",
      {
        description: "List partners sorted by creation date.",
        inputSchema: {
          ...paginationShape,
          sortOrder: sortOrder.optional().describe("Defaults to desc"),
        },
        annotations: { readOnlyHint: true },
      },
      ({ take, skip, sortOrder }) =>
        runTool(() =>
          this.partnerService.findAll({
            take,
            skip,
            orderBy: { createdAt: sortOrder ?? "desc" },
          }),
        ),
    );

    server.registerTool(
      "get_partner",
      {
        description: "Get a partner by id.",
        inputSchema: { id: z.string() },
        annotations: { readOnlyHint: true },
      },
      ({ id }) => runTool(() => this.partnerService.findOne({ where: { id } })),
    );

    server.registerTool(
      "create_partner",
      {
        description: "Create a partner.",
        inputSchema: { data: dtoPayload(partnerFields) },
      },
      ({ data }) =>
        runTool(async () =>
          this.partnerService.create(await validateDto(CreatePartnerDto, data)),
        ),
    );

    server.registerTool(
      "update_partner",
      {
        description: "Partially update a partner.",
        inputSchema: {
          id: z.string().describe("Partner id"),
          data: dtoPayload(`all optional: ${partnerFields}`),
        },
      },
      ({ id, data }) =>
        runTool(async () =>
          this.partnerService.update({
            where: { id },
            data: await validateDto(UpdatePartnerDto, data),
          }),
        ),
    );

    server.registerTool(
      "list_partner_crm_options",
      {
        description:
          "Show which delivery service (who ships), payment methods (prepaid / cash on delivery), " +
          "order source and manager a partner's new orders are created with in its KeyCRM, " +
          "together with all values available in that CRM.",
        inputSchema: { id: z.string().describe("Partner id") },
        annotations: { readOnlyHint: true },
      },
      ({ id }) =>
        runTool(async () => {
          const partner = await this.keyCrm.partner(id);
          const options = await this.loadOptions(
            partner,
            Object.keys(CRM_SETTINGS) as CrmSetting[],
          );
          return Object.fromEntries(
            (Object.keys(CRM_SETTINGS) as CrmSetting[]).map((setting) => {
              const { field, label } = CRM_SETTINGS[setting];
              const currentId = partner[field];
              return [
                setting,
                {
                  label,
                  current: options[setting].find((o) => o.id === currentId) ?? {
                    id: currentId,
                    name: "(not found in CRM)",
                  },
                  available: options[setting],
                },
              ];
            }),
          );
        }),
    );

    server.registerTool(
      "set_partner_crm_options",
      {
        description:
          "Choose, by name or id, the delivery service (who ships), payment methods, order source " +
          "and manager used for a partner's new KeyCRM orders. Names are matched against the partner's " +
          "CRM (exact or unique fragment, case-insensitive); see list_partner_crm_options.",
        inputSchema: {
          id: z.string().describe("Partner id"),
          deliveryService: crmValue.describe(
            CRM_SETTINGS.deliveryService.label,
          ),
          prePaymentMethod: crmValue.describe(
            CRM_SETTINGS.prePaymentMethod.label,
          ),
          postPaymentMethod: crmValue.describe(
            CRM_SETTINGS.postPaymentMethod.label,
          ),
          source: crmValue.describe(CRM_SETTINGS.source.label),
          manager: crmValue.describe(CRM_SETTINGS.manager.label),
        },
      },
      ({ id, ...values }) =>
        runTool(async () => {
          const settings = (Object.keys(values) as CrmSetting[]).filter(
            (setting) => values[setting] !== undefined,
          );
          if (!settings.length) throw new Error("Pass at least one setting");
          const partner = await this.keyCrm.partner(id);
          const options = await this.loadOptions(partner, settings);

          const data: Partial<
            Record<(typeof CRM_SETTINGS)[CrmSetting]["field"], number>
          > = {};
          const changes: Record<string, { from: number; to: CrmOption }> = {};
          for (const setting of settings) {
            const { field, label } = CRM_SETTINGS[setting];
            const option = resolveOption(
              label,
              options[setting],
              values[setting],
            );
            data[field] = option.id;
            changes[setting] = { from: partner[field], to: option };
          }
          await this.partnerService.update({ where: { id }, data });
          return { partner: partner.name, changes };
        }),
    );

    server.registerTool(
      "import_crm_products",
      {
        description:
          "Create shop products for KeyCRM products of a partner that are not in the shop yet " +
          "(name, description, price, SKU, photos, sizes). Existing shop products are not changed. " +
          "Skips archived CRM products and products whose CRM category is not linked to a shop category " +
          "(category keyCrmId); the result lists every skipped product with the reason. " +
          "Run with dryRun first to preview; hidden: true creates the new products hidden from the shop.",
        inputSchema: {
          id: z.string().describe("Partner id"),
          dryRun: z
            .boolean()
            .optional()
            .describe("Only report what would be created"),
          hidden: z
            .boolean()
            .optional()
            .describe(
              "Create new products hidden from the shop (default false)",
            ),
          keyCrmIds: z
            .array(z.number().int().positive())
            .optional()
            .describe("Only these KeyCRM product ids"),
          limit: z
            .number()
            .int()
            .min(1)
            .max(200)
            .optional()
            .describe("Max products to create in one run (default 50)"),
        },
        annotations: { destructiveHint: false },
      },
      (params) => runTool(() => this.importProducts(params)),
    );

    server.registerTool(
      "delete_partner",
      {
        description: "Delete a partner by id.",
        inputSchema: { id: z.string() },
        annotations: { destructiveHint: true },
      },
      ({ id }) => runTool(() => this.partnerService.remove({ where: { id } })),
    );
  }

  private async importProducts(params: {
    id: string;
    dryRun?: boolean;
    hidden?: boolean;
    keyCrmIds?: number[];
    limit?: number;
  }) {
    const { dryRun = false, hidden = false, keyCrmIds } = params;
    const limit = params.limit ?? 50;
    const partner = await this.keyCrm.partner(params.id);

    const [crmCategories, crmProducts] = await Promise.all([
      this.keyCrm.listAll<TCategory>(partner, "/products/categories"),
      keyCrmIds?.length
        ? this.listByIds<TProduct>(partner, "/products", keyCrmIds)
        : this.keyCrm.listAll<TProduct>(partner, "/products", IMPORT_MAX_PAGES),
    ]);
    const crmCategoryName = new Map(crmCategories.map((c) => [c.id, c.name]));

    const [shopCategories, existing] = await Promise.all([
      this.prisma.category.findMany({
        where: { keyCrmId: { not: null } },
        select: { id: true, name: true, keyCrmId: true, isDeleted: true },
        orderBy: { isDeleted: "asc" },
      }),
      this.prisma.product.findMany({
        where: {
          partnersId: partner.id,
          keyCrmId: { in: crmProducts.map((p) => p.id) },
        },
        select: { keyCrmId: true },
      }),
    ]);
    const categoryByCrmId = new Map<number, (typeof shopCategories)[number]>();
    for (const category of shopCategories) {
      if (!categoryByCrmId.has(category.keyCrmId)) {
        categoryByCrmId.set(category.keyCrmId, category);
      }
    }
    const existingIds = new Set(existing.map((p) => p.keyCrmId));

    const skipped: { name: string; keyCrmId: number; reason: string }[] = [];
    const toCreate: {
      product: TProduct;
      category: (typeof shopCategories)[number];
    }[] = [];
    let alreadyInShop = 0;
    for (const product of crmProducts) {
      if (existingIds.has(product.id)) {
        alreadyInShop++;
        continue;
      }
      const skip = (reason: string) =>
        skipped.push({ name: product.name, keyCrmId: product.id, reason });
      if (product.is_archived) {
        skip("archived in KeyCRM");
        continue;
      }
      if (EXCLUDED_CRM_CATEGORIES.includes(product.category_id)) {
        skip(`excluded KeyCRM category ${product.category_id}`);
        continue;
      }
      const category = categoryByCrmId.get(product.category_id);
      if (!category) {
        skip(
          `KeyCRM category "${crmCategoryName.get(product.category_id) ?? "?"}" ` +
            `(${product.category_id}) is not linked to a shop category`,
        );
        continue;
      }
      toCreate.push({ product, category });
    }
    const batch = toCreate.slice(0, limit);

    const offers = batch.length
      ? await this.listByIds<TOffer>(
          partner,
          "/offers",
          batch.map(({ product }) => product.id),
        )
      : [];
    const sizesOf = (productId: number) =>
      offers
        .filter((o) => o.product_id === productId && o.properties?.length)
        .map((o) => ({
          keyCrmId: o.id,
          name: o.properties[0].value,
          quantity: o.quantity,
          isAvailable: true,
          sku: o.sku,
        }));

    const usedAliases = new Set(
      (
        await this.prisma.product.findMany({
          where: {
            OR: batch.map(({ product }) => ({
              alias: { startsWith: aliasBase(product.name) },
            })),
          },
          select: { alias: true },
        })
      ).map((p) => p.alias),
    );
    const uniqueAlias = (name: string) => {
      const base = aliasBase(name);
      let alias = base;
      for (let n = 2; usedAliases.has(alias); n++) alias = `${base}-${n}`;
      usedAliases.add(alias);
      return alias;
    };

    const created: unknown[] = [];
    const failed: { name: string; keyCrmId: number; error: string }[] = [];
    for (const { product, category } of batch) {
      const sizes = sizesOf(product.id);
      const alias = uniqueAlias(product.name);
      const summary = {
        name: product.name,
        keyCrmId: product.id,
        alias,
        category: category.name,
        price: product.max_price,
        sku: product.sku,
        photos: product.attachments_data?.length ?? 0,
        sizes: sizes.map((s) => s.name),
        hidden,
      };
      if (dryRun) {
        created.push(summary);
        continue;
      }
      try {
        const shopProduct = await this.prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            price: product.max_price,
            discount: 0,
            alias,
            sku: product.sku,
            quantity: product.quantity,
            hidden,
            keyCrmId: product.id,
            createdAt: new Date(product.created_at),
            category: { connect: { id: category.id } },
            Partner: { connect: { id: partner.id } },
            images: {
              create: (product.attachments_data ?? []).map((url, order) => ({
                url,
                order,
              })),
            },
            productSizes: { create: sizes },
          },
          select: { id: true },
        });
        created.push({ id: shopProduct.id, ...summary });
      } catch (error) {
        failed.push({
          name: product.name,
          keyCrmId: product.id,
          error: (error as Error).message,
        });
      }
    }

    return {
      partner: partner.name,
      dryRun,
      crmProducts: crmProducts.length,
      alreadyInShop,
      [dryRun ? "wouldCreate" : "created"]: created,
      remainingNew: toCreate.length - batch.length,
      skipped,
      failed,
    };
  }

  /** Lists KeyCRM products or offers of the given product ids, 50 ids per request. */
  private async listByIds<T>(
    partner: Awaited<ReturnType<KeyCrmClient["partner"]>>,
    path: string,
    ids: number[],
  ): Promise<T[]> {
    const items: T[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const page = await this.keyCrm.listAll<T & { id: number }>(
        partner,
        `${path}?filter[product_id]=${chunk.join(",")}`,
      );
      // Guard against KeyCRM ignoring the filter.
      const wanted = new Set(chunk);
      items.push(
        ...page.filter((item) =>
          wanted.has(
            path === "/offers"
              ? (item as unknown as TOffer).product_id
              : item.id,
          ),
        ),
      );
    }
    return items;
  }

  /** Loads the KeyCRM option lists needed for the given settings (shared paths fetched once). */
  private async loadOptions(
    partner: Awaited<ReturnType<KeyCrmClient["partner"]>>,
    settings: CrmSetting[],
  ): Promise<Record<CrmSetting, CrmOption[]>> {
    const byPath = new Map<string, Promise<CrmOption[]>>();
    const result = {} as Record<CrmSetting, CrmOption[]>;
    for (const setting of settings) {
      const { path } = CRM_SETTINGS[setting];
      if (!byPath.has(path)) {
        byPath.set(
          path,
          this.keyCrm
            .listAll<{
              id: number;
              name?: string;
              full_name?: string;
            }>(partner, path)
            .then((items) =>
              items.map((item) => ({ id: item.id, name: optionName(item) })),
            ),
        );
      }
      result[setting] = await byPath.get(path);
    }
    return result;
  }
}
