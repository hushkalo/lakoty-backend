import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpApiKeyGuard } from "./mcp-api-key.guard";
import { ProductsMcpTools } from "./tools/products.tools";
import { CategoriesMcpTools } from "./tools/categories.tools";
import { PartnersMcpTools } from "./tools/partners.tools";

/**
 * Stateless MCP endpoint (Streamable HTTP transport).
 * Every POST creates a fresh server + transport, so no session state is kept between requests.
 */
@ApiExcludeController()
@UseGuards(McpApiKeyGuard)
@Controller("mcp")
export class McpController {
  constructor(
    private readonly productsTools: ProductsMcpTools,
    private readonly categoriesTools: CategoriesMcpTools,
    private readonly partnersTools: PartnersMcpTools,
  ) {}

  @Post()
  async handle(@Req() req: Request, @Res() res: Response) {
    const server = new McpServer({ name: "lakoty-admin", version: "1.0.0" });
    this.productsTools.register(server);
    this.categoriesTools.register(server);
    this.partnersTools.register(server);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  // Stateless mode has no server-initiated SSE stream and no sessions to terminate.
  @Get()
  get(@Res() res: Response) {
    this.methodNotAllowed(res);
  }

  @Delete()
  delete(@Res() res: Response) {
    this.methodNotAllowed(res);
  }

  private methodNotAllowed(res: Response) {
    res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
  }
}
