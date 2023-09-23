import { Controller, Get, Render } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Public')
@Controller('')
export class PublicController {
    @Get(['/', 'index'])
    @Render('index')
    getMain(): any {
        return { isIndex: true };
    }

    @Get('/news')
    @Render('news')
    getNews(): any {
        return { isNews: true };
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
