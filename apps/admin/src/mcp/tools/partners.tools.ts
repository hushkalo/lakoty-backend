import { Injectable } from "@nestjs/common";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PartnerService } from "../../partners/partner.service";
import { CreatePartnerDto } from "../../partners/dto/create-partner.dto";
import { UpdatePartnerDto } from "../../partners/dto/update-partner.dto";
import {
  dtoPayload,
  paginationShape,
  runTool,
  sortOrder,
  validateDto,
} from "../mcp.utils";

const partnerFields =
  "name (3-50 chars), apiKey, apiUrl (URL), managerId, sourceId, postPayId, prePayId, deliveryServiceId (positive numbers), " +
  "isUpdate? (boolean), instagram? (URL), telegram? (URL), phone?";

@Injectable()
export class PartnersMcpTools {
  constructor(private readonly partnerService: PartnerService) {}

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
      "delete_partner",
      {
        description: "Delete a partner by id.",
        inputSchema: { id: z.string() },
        annotations: { destructiveHint: true },
      },
      ({ id }) => runTool(() => this.partnerService.remove({ where: { id } })),
    );
  }
}
