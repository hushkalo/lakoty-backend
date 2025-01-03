import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ServerStatus } from "@prisma/client";

@Injectable()
export class StatusService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ServerStatus[]> {
    return this.prisma.serverStatus.findMany();
  }
}
