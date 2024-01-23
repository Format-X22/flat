import { Injectable } from '@nestjs/common';
import { CalcArgs, ETaskResult, TTaskIdResponse, TTaskResult } from './control.dto';
import { v4 as uuid } from 'uuid';
import { LoaderService } from '../analyzer/loader/loader.service';
import { CalculatorService } from '../analyzer/calculator/calculator.service';
import { endOfYear, startOfYear } from '../utils/time.util';

@Injectable()
export class ControlService {
    private taskMap: Map<string, TTaskResult> = new Map();

    constructor(private loadService: LoaderService, private calculatorService: CalculatorService) {}

    async truncate(): Promise<TTaskIdResponse> {
        return this.wrapTask(() => this.loadService.truncate());
    }

    async loadActual(): Promise<TTaskIdResponse> {
        return this.wrapTask(() => this.loadService.loadActual());
    }

    async calc({ risk, fromYear, toYear, withLoad }: CalcArgs): Promise<TTaskIdResponse> {
        return this.wrapTask(() => {
            const config = {
                risk,
                from: startOfYear(fromYear),
                to: endOfYear(toYear),
            };

            if (withLoad) {
                return this.loadService.loadActual().then(() => this.calculatorService.calc(config));
            } else {
                return this.calculatorService.calc(config);
            }
        });
    }

    async getTask(id: string): Promise<TTaskResult> {
        return this.taskMap.get(id);
    }

    private wrapTask(fn: () => Promise<unknown>): TTaskIdResponse {
        const taskId = uuid();
        const result: TTaskResult = { status: ETaskResult.PROCESS };

        fn().then(
            (value: unknown) => {
                result.status = ETaskResult.OK;
                result.message = JSON.stringify(value) || 'OK';
            },
            (reason) => {
                result.status = ETaskResult.FAIL;
                result.error = String(reason);
            },
        );

        this.taskMap.set(taskId, result);

        return { taskId };
    }
}
