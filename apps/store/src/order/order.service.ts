import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PrismaService } from "@libs/prisma-client";
import { ErrorModel } from "@shared/error-model";
import { ProductsService } from "../products/products.service";

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async create(params: { data: CreateOrderDto }) {
    const { orderProducts, ...rest } = params.data;
    const { productIds, productSizeIds } = orderProducts.reduce(
      (
        acc: {
          productIds: string[];
          productSizeIds: string[];
        },
        item,
      ) => {
        const productId = item.productId;
        const productSizeId = item.size.productSizeId;

        return {
          productIds: [...acc.productIds, productId],
          productSizeIds: [...acc.productSizeIds, productSizeId],
        };
      },
      {
        productIds: [],
        productSizeIds: [],
      },
    );
    const findAllProduct = await this.productsService.findAll({
      where: {
        id: {
          in: productIds,
        },
      },
    });
    if (findAllProduct.total !== productIds.length) {
      const notFoundProduct = productIds.filter(
        (item) => !findAllProduct.data.some((product) => product.id === item),
      );
      throw new BadRequestException(
        ErrorModel.PRODUCT_DOES_NOT_EXIST + notFoundProduct.join(", "),
      );
    }
    const findAllProductSize = await this.productsService.findAll({
      where: {
        productSizes: {
          some: {
            id: {
              in: productSizeIds,
            },
          },
        },
      },
    });
    if (findAllProductSize.total !== productSizeIds.length) {
      const notFoundProductSize = productSizeIds.filter(
        (item) =>
          !findAllProductSize.data.some((product) =>
            product.productSizes.some((size) => size.id === item),
          ),
      );
      throw new BadRequestException(
        ErrorModel.PRODUCT_SIZE_NOT_FOUND + notFoundProductSize.join(", "),
      );
    }
    return this.prisma.order.create({
      data: {
        ...rest,
        Status: {
          connect: {
            id: 1,
          },
        },
        OrderProduct: {
          createMany: {
            data: orderProducts.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              sizeId:
                item.size.name === "base" ? undefined : item.size.productSizeId,
            })),
          },
        },
      },
    });
  }
}
