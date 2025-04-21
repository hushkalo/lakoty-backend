import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma, User } from "@libs/prisma-client";
import { PrismaService } from "@libs/prisma-client";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { hashPassword } from "../utils/bcrypt.util";
import { ErrorModel } from "@shared/error-model";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<Omit<User, "password">> {
    const { roleId, password, ...rest } = data;
    const hashedPassword = await hashPassword(password);
    return this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        role: {
          connect: {
            id: roleId,
          },
        },
      },
      omit: {
        password: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    omit?: Prisma.UserOmit;
    include?: Prisma.UserInclude;
  }) {
    const { omit, include, ...restParams } = params;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        ...params,
        omit,
        include,
      }),
      this.prisma.user.count({
        ...restParams,
      }),
    ]);
    return {
      data: users,
      total,
      to: users.length,
    };
  }

  findOne(params: {
    where: Prisma.UserWhereUniqueInput;
    include?: Prisma.UserInclude;
    omit?: Prisma.UserOmit;
    select?: Prisma.UserSelect;
  }) {
    return this.prisma.user.findUnique(params);
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: UpdateUserDto;
  }) {
    const { password, confirmPassword, ...rest } = params.data;
    if (password && confirmPassword === password) {
      throw new BadRequestException(ErrorModel.USER_PASSWORD_NOT_MATCH);
    }
    const passwordHash = password ? await hashPassword(password) : undefined;
    return this.prisma.user.update({
      where: params.where,
      data: {
        ...rest,
        password: passwordHash,
      },
    });
  }

  remove(params: { where: Prisma.UserWhereUniqueInput }) {
    return this.prisma.user.delete(params);
  }
}
