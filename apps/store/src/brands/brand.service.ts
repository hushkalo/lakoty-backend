import { Injectable } from "@nestjs/common";
import { Prisma, PrismaService } from "@libs/prisma-client";
import { BrandResponseDto } from "./dto/responses.dto";
import { BrandDto } from "./dto/brand.dto";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class BrandService {
  constructor(
    private prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findOne(params: {
    where: Prisma.BrandsWhereUniqueInput;
  }): Promise<BrandDto> {
    const redisData = await this.redisService.get<BrandDto>(
      `brands/findOne?${JSON.stringify(params)}`,
    );

    if (redisData) {
      return redisData;
    }

    const brand = await this.prisma.brands.findUnique({
      where: {
        ...params.where,
      },
    });

    if (!brand) {
      return null;
    }

    await this.redisService.set(
      `categories/findOne?${JSON.stringify(params)}`,
      brand,
      60,
    );
    return brand;
  }

  countBrand(params?: { where?: Prisma.BrandsWhereInput }): Promise<number> {
    return this.prisma.brands.count(params);
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.BrandsWhereInput;
    orderBy?: Prisma.BrandsOrderByWithRelationInput[];
  }): Promise<BrandResponseDto> {
    const redisData = await this.redisService.get<BrandResponseDto>(
      `brands/findAll?${JSON.stringify(params)}`,
    );

    if (redisData) {
      return redisData;
    }

    const { where, ...restParams } = params;
    const count = await this.countBrand({
      where,
    });

    const data = await this.prisma.brands.findMany({
      ...restParams,
      where,
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = {
      data,
      total: count,
      to: data.length,
    };

    await this.redisService.set(
      `brands/findAll?${JSON.stringify(params)}`,
      response,
      60,
    );

    return response;
  }
}
