import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { isAxiosError } from "axios";
import { type Partners, PrismaService } from "@libs/prisma-client";

type Paginated<T> = { data: T[]; next_page_url?: string | null };

const PAGE_LIMIT = 50;
const MAX_PAGES = 20;
const RATE_LIMIT_RETRIES = 4;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Thin KeyCRM API client that talks to a partner's own CRM with its stored credentials. */
@Injectable()
export class KeyCrmClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async partner(partnerId: string | null): Promise<Partners> {
    const partner = partnerId
      ? await this.prisma.partners.findUnique({ where: { id: partnerId } })
      : null;
    if (!partner) {
      throw new NotFoundException(`Partner ${partnerId} not found`);
    }
    return partner;
  }

  async request<T>(
    partner: Partners,
    method: "GET" | "PUT",
    path: string,
    body?: unknown,
  ): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        const { data } = await this.httpService.axiosRef.request<T>({
          method,
          url: path,
          baseURL: partner.apiUrl,
          data: body,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${partner.apiKey}`,
          },
          timeout: 20000,
        });
        return data;
      } catch (error) {
        // KeyCRM allows ~60 requests per minute: wait and retry on 429.
        if (
          isAxiosError(error) &&
          error.response?.status === 429 &&
          attempt < RATE_LIMIT_RETRIES
        ) {
          const retryAfter = Number(error.response.headers?.["retry-after"]);
          await sleep(
            Math.min(
              Number.isFinite(retryAfter) && retryAfter > 0
                ? retryAfter * 1000
                : 2000 * attempt,
              30000,
            ),
          );
          continue;
        }
        this.fail(partner, method, path, error);
      }
    }
  }

  private fail(
    partner: Partners,
    method: string,
    path: string,
    error: unknown,
  ): never {
    if (isAxiosError(error) && error.response) {
      throw new BadGatewayException({
        message: `KeyCRM (${partner.name}) responded ${error.response.status} to ${method} ${path}`,
        details: error.response.data as unknown,
      });
    }
    throw new BadGatewayException(
      `KeyCRM (${partner.name}) is unreachable: ${(error as Error).message}`,
    );
  }

  /** Fetches every page of a paginated list endpoint (path may already have a query). */
  async listAll<T>(
    partner: Partners,
    path: string,
    maxPages = MAX_PAGES,
  ): Promise<T[]> {
    const items: T[] = [];
    const separator = path.includes("?") ? "&" : "?";
    for (let page = 1; page <= maxPages; page++) {
      const response = await this.request<Paginated<T>>(
        partner,
        "GET",
        `${path}${separator}limit=${PAGE_LIMIT}&page=${page}`,
      );
      items.push(...response.data);
      if (!response.next_page_url) break;
    }
    return items;
  }
}
