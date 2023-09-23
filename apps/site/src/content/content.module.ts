import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModel } from './content.model';

@Module({
    imports: [TypeOrmModule.forFeature([PostModel])],
    providers: [ContentService],
    controllers: [ContentController],
    exports: [ContentService],
})
export class ContentModule {}
