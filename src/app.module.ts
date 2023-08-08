import { Module } from '@nestjs/common';
import { LoaderModule } from './loader/loader.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from './loader/candle.model';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            database: 'local',
            entities: [CandleModel],
            synchronize: true,
        }),
        LoaderModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
