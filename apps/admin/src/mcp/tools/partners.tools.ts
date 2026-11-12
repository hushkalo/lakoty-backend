import { Injectable } from "@nestjs/common";
import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PartnerService } from "../../partners/partner.service";
import { CreatePartnerDto } from "../../partners/dto/create-partner.dto";
import { UpdatePartnerDto } from "../../partners/dto/update-partner.dto";
import { KeyCrmClient } from "../keycrm.client";
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
      "delete_partner",
      {
        description: "Delete a partner by id.",
        inputSchema: { id: z.string() },
        annotations: { destructiveHint: true },
      },
      ({ id }) => runTool(() => this.partnerService.remove({ where: { id } })),
    );
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
