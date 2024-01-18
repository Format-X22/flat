import { Module } from '@nestjs/common';
import { CalcCommand } from './calc.command';
import { CalcQuestion } from './calc.question';

@Module({
    providers: [CalcCommand, CalcQuestion],
    exports: [],
})
export class ControlModule {}
