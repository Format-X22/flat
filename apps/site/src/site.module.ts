import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PublicModule } from './public/public.module';
import { StatusModule } from './status/status.module';
import { ContentModule } from './content/content.module';
import { PostModel } from './content/content.model';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return {
                    type: 'postgres',
                    host: config.get('F_SITE_DB_HOST'),
                    port: config.get('F_SITE_DB_PORT'),
                    username: config.get('F_SITE_DB_USERNAME'),
                    password: config.get('F_SITE_DB_PASSWORD'),
                    database: config.get('F_SITE_DB_NAME'),
                    entities: [PostModel],
                    synchronize: true,
                };
            },
        }),
        PublicModule,
        StatusModule,
        ContentModule,
    ],
    controllers: [],
    providers: [],
})
export class SiteModule {}
