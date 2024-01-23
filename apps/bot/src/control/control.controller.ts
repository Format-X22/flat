import { Controller, Get, Query } from '@nestjs/common';
import { CalcArgs, TaskArgs, TTaskIdResponse, TTaskResult } from './control.dto';
import { ApiTags } from '@nestjs/swagger';
import { ControlService } from './control.service';

@Controller('control')
@ApiTags('Main api')
export class ControlController {
    constructor(private controlService: ControlService) {}

    @Get('truncate')
    async truncate(): Promise<TTaskIdResponse> {
        return this.controlService.truncate();
    }

    @Get('load-actual')
    async loadActual(): Promise<TTaskIdResponse> {
        return this.controlService.loadActual();
    }

    @Get('calc')
    async calc(@Query() args: CalcArgs): Promise<TTaskIdResponse> {
        return this.controlService.calc(args);
    }

    @Get('task')
    async getTask(@Query() args: TaskArgs): Promise<TTaskResult> {
        return this.controlService.getTask(args.id);
    }
}
