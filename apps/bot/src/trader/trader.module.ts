import { Module } from '@nestjs/common';
import { TraderService } from './trader.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
    imports: [TelegramModule],
    providers: [TraderService],
    exports: [TraderService],
})
export class TraderModule {}
