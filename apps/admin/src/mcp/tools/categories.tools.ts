import { Injectable } from "@nestjs/common";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CategoriesService } from "../../categories/categories.service";
import { CreateCategoryDto } from "../../categories/dto/create-category.dto";
import { UpdateCategoryDto } from "../../categories/dto/update-category.dto";
import { McpUserService } from "../mcp-user.service";
import {
  dtoPayload,
  paginationShape,
  runTool,
  sortOrder,
  validateDto,
} from "../mcp.utils";

const categoryFields =
  "name, alias (lowercase letters, numbers, hyphens), description?, keyCrmId? (number), parentCategoryId?, imageUrl? (URL)";

@Injectable()
export class CategoriesMcpTools {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly mcpUser: McpUserService,
  ) {}

  register(server: McpServer, userId?: string) {
    server.registerTool(
      "list_categories",
      {
        description: "List categories (not deleted) with search and sorting.",
        inputSchema: {
          ...paginationShape,
          search: z.string().optional(),
          withSubCategories: z.boolean().optional(),
          sortBy: z
            .enum(["createdAt", "updatedAt", "name", "alias", "top", "depth"])
            .optional(),
          sortOrder: sortOrder.optional().describe("Defaults to desc"),
        },
        annotations: { readOnlyHint: true },
      },
      ({ take, skip, search, withSubCategories, sortBy, sortOrder }) =>
        runTool(() =>
          this.categoriesService.findAll({
            take,
            skip,
            where: {
              name: { contains: search, mode: "insensitive" },
              isDeleted: false,
            },
            withSubCategories: withSubCategories ?? false,
            orderBy: sortBy ? [{ [sortBy]: sortOrder ?? "desc" }] : undefined,
          }),
        ),
    );

    server.registerTool(
      "get_category",
      {
        description:
          "Get a category by id or alias, including its products (paginated by take/skip).",
        inputSchema: {
          id: z.string().optional(),
          alias: z.string().optional(),
          ...paginationShape,
        },
        annotations: { readOnlyHint: true },
      },
      ({ id, alias, take, skip }) =>
        runTool(async () => {
          if (!id && !alias) throw new Error("Pass either id or alias");
          return this.categoriesService.findOne({
            take,
            skip,
            where: id ? { id } : { alias },
          });
        }),
    );

    server.registerTool(
      "create_category",
      {
        description: "Create a category.",
        inputSchema: { data: dtoPayload(categoryFields) },
      },
      ({ data }) =>
        runTool(async () =>
          this.categoriesService.create(
            await validateDto(CreateCategoryDto, data),
          ),
        ),
    );

    server.registerTool(
      "update_category",
      {
        description: "Partially update a category.",
        inputSchema: {
          id: z.string().describe("Category id"),
          data: dtoPayload(`all optional: ${categoryFields}`),
        },
      },
      ({ id, data }) =>
        runTool(async () =>
          this.categoriesService.update({
            where: { id },
            data: await validateDto(UpdateCategoryDto, data),
            user: await this.mcpUser.getActingUser(userId),
          }),
        ),
    );

    server.registerTool(
      "delete_category",
      {
        description: "Delete a category by id.",
        inputSchema: { id: z.string() },
        annotations: { destructiveHint: true },
      },
      ({ id }) => runTool(() => this.categoriesService.remove({ id })),
    );
  }
}
