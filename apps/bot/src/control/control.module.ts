import { Module } from '@nestjs/common';
import { ControlService } from './control.service';
import { LoaderModule } from '../loader/loader.module';
import { AnalyzerModule } from '../analyzer/analyzer.module';
import { TraderModule } from '../trader/trader.module';

@Module({
    imports: [LoaderModule, AnalyzerModule, TraderModule],
    providers: [ControlService],
})
export class ControlModule {}
