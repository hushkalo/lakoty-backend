import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "../decorators/user.decorator";
import { type User as UserModel } from "@libs/prisma-client";
import { JwtGuard } from "../guards/jwt.guard";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtGuard)
  @Get("profile")
  profile(@User() user: UserModel) {
    return user;
  }

  @UseGuards(JwtGuard)
  @Get()
  findAll(
    @Query("skip") skip: string,
    @Query("take") take: string,
    @Query("roleId") roleId: string,
    @Query("orderBy") orderBy: "asc" | "desc",
  ) {
    return this.userService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: {
        roleId: roleId ? roleId : undefined,
      },
      orderBy: {
        createdAt: orderBy || "asc",
      },
      include: {
        role: true,
      },
      omit: {
        password: true,
      },
    });
  }

  @UseGuards(JwtGuard)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.userService.findOne({
      where: { id: id },
      include: { role: true },
    });
  }

  @UseGuards(JwtGuard)
  @Patch("profile/edit")
  update(@User() user: UserModel, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update({
      where: { id: user.id },
      data: updateUserDto,
    });
  }

  @UseGuards(JwtGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.userService.remove({
      where: { id: id },
    });
  }
}
