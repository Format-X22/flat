import { Controller, Get, Render } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContentService } from '../content/content.service';

@ApiTags('Public')
@Controller('')
export class PublicController {
    constructor(private contentService: ContentService) {}

    @Get(['/', 'index'])
    @Render('index')
    getMain(): any {
        return { isIndex: true };
    }

    @Get('/news')
    @Render('news')
    async getNews(): Promise<any> {
        return {
            isNews: true,
            posts: await this.contentService.getPosts({ skip: 0, limit: 100 }),
        };
    }

    @Get('/contacts')
    @Render('contacts')
    getContacts(): any {
        return { isContacts: true };
    }

    @Get('/calculator')
    @Render('calculator')
    getCalculator(): any {
        return { isCalculator: true };
    }
}
