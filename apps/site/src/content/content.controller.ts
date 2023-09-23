import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ContentGuard } from './content.guard';
import { PostArgs, PostDto, PostListArgs } from './content.dto';
import { ContentService } from './content.service';

@ApiSecurity('session')
@ApiTags('Content')
@Controller('api/content')
@UseGuards(ContentGuard)
export class ContentController {
    constructor(private contentService: ContentService) {}

    @Get('post')
    async getPosts(@Query() query: PostListArgs): Promise<Array<PostDto>> {
        return this.contentService.getPosts(query);
    }

    @Post('post')
    async addPost(@Body() post: PostArgs): Promise<void> {
        return this.contentService.addPost(post);
    }

    @Patch('post/:id')
    async editPost(@Param('id', ParseIntPipe) id: number, @Body() post: PostArgs): Promise<void> {
        return this.contentService.editPost(id, post);
    }

    @Delete('post/:id')
    async deletePost(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.contentService.deletePost(id);
    }
}
