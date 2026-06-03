import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { NovelsService } from './novels.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('novels')
export class NovelsController {
  constructor(private readonly novelsService: NovelsService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.novelsService.findAll(search);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AUTHOR, Role.ADMIN)
  @Get('author')
  async findByAuthor(@Request() req) {
    return this.novelsService.findByAuthor(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.novelsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AUTHOR, Role.ADMIN)
  @Post()
  async create(
    @Request() req,
    @Body('title') title: string,
    @Body('summary') summary: string,
    @Body('coverUrl') coverUrl?: string,
  ) {
    return this.novelsService.create(req.user.id, title, summary, coverUrl);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.AUTHOR, Role.ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { title?: string; summary?: string; coverUrl?: string; status?: string },
  ) {
    return this.novelsService.update(id, req.user.id, body);
  }
}
