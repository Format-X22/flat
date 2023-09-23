import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModel } from '../content/content.model';
import { ContentModule } from '../content/content.module';

@Module({
    imports: [TypeOrmModule.forFeature([PostModel]), ContentModule],
    controllers: [PublicController],
})
export class PublicModule {}
