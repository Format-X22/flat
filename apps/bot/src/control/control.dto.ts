import { Property } from '../utils/decorator.utils';
import { IsBoolean, IsInt, IsNumber, IsUUID } from 'class-validator';

export class CalcArgs {
    @Property({ default: 33 })
    @IsNumber()
    @IsInt()
    risk: number = 33;

    @Property({ default: 2018 })
    @IsNumber()
    @IsInt()
    fromYear: number = 2018;

    @Property({ default: 2100 })
    @IsNumber()
    @IsInt()
    toYear: number = 2100;

    @Property({ default: true })
    @IsBoolean()
    withLoad: boolean = true;
}

export class TaskArgs {
    @Property()
    @IsUUID()
    id: string;
}

export type TTaskId = string;

export type TTaskIdResponse = {
    taskId: TTaskId;
};

export enum ETaskResult {
    PROCESS = 'PROCESS',
    OK = 'OK',
    FAIL = 'FAIL',
}

export type TTaskResult = {
    status: ETaskResult;
    message?: string;
    error?: string;
};
