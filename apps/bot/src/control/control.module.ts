import { Module } from '@nestjs/common';
import { ControlController } from './control.controller';
import { ControlService } from './control.service';
import { AnalyzerModule } from '../analyzer/analyzer.module';

@Module({
    imports: [AnalyzerModule],
    controllers: [ControlController],
    providers: [ControlService],
})
export class ControlModule {}
