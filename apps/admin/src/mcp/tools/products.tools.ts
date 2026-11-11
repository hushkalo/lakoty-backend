import { Injectable } from "@nestjs/common";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProductsService } from "../../products/products.service";
import { CreateProductDto } from "../../products/dto/create-product.dto";
import { UpdateProductDto } from "../../products/dto/update-product.dto";
import { CreateColorsDto } from "../../products/dto/color.dto";
import { CreateVariantGroupDto } from "../../products/dto/create-variant-group.dto";
import { McpUserService } from "../mcp-user.service";
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
          "Partially update a product. Images/sizes with an id are updated, without id are created.",
        inputSchema: {
          id: z.string().describe("Product id"),
          data: dtoPayload(
            `all optional: name, description, alias, price, categoryId, quantity, discount, top, isNovelty, ` +
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
}
