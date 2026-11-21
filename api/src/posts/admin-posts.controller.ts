import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import {
  parseDraft,
  parseStatusChange,
  parseStatusFilter,
  parseUpdate,
  updatedAtToken,
} from './post-input'
import { PostsService } from './posts.service'

/** Owner-only post management. `OwnerGuard` applies to every route here. */
@Controller('admin/api/posts')
export class AdminPostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  list(@Query('status') status: unknown) {
    return this.posts.list(parseStatusFilter(status))
  }

  @Post()
  create(@Body() body: unknown) {
    return this.posts.create(parseDraft(body))
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.posts.get(id)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.posts.update(id, parseUpdate(body))
  }

  @Put(':id/status')
  changeStatus(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.posts.changeStatus(id, parseStatusChange(body))
  }

  @Delete(':id')
  @HttpCode(204)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Query('updatedAt') updatedAt: unknown,
  ) {
    this.posts.delete(id, updatedAtToken(updatedAt))
  }
}
