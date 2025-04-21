import { Injectable } from "@nestjs/common";
import { ServerStatus, PrismaService } from "@libs/prisma-client";

@Injectable()
export class StatusService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ServerStatus[]> {
    return this.prisma.serverStatus.findMany();
  }
}
