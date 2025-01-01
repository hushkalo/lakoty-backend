import {
  Controller,
  Get,
  // Post,
  // Body,
  // Patch,
  // Param,
  // Delete,
} from "@nestjs/common";
import { StatusService } from "./status.service";
import { ServerStatus as ServerStatusModel } from "@prisma/client";

@Controller("status")
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  // @Post()
  // create(@Body() createStatusDto: CreateStatusDto) {
  //   return this.statusService.create(createStatusDto);
  // }

  @Get()
  findAll(): Promise<ServerStatusModel[]> {
    return this.statusService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.statusService.findOne(+id);
  // }
  //
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
  //   return this.statusService.update(+id, updateStatusDto);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.statusService.remove(+id);
  // }
}
