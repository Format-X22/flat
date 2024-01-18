import { Question, QuestionSet } from 'nest-commander';

@QuestionSet({ name: 'calc' })
export class CalcQuestion {
    @Question({
        type: 'list',
        name: 'stock',
        message: 'Choice stock',
        choices: ['Binance'],
    })
    getStock(value: string): string {
        return value;
    }

    @Question({
        type: 'list',
        name: 'pair',
        message: 'Choice pair',
        choices: ['BTCUSDT'],
    })
    getPair(value: string): string {
        return value;
    }

    @Question({
        type: 'list',
        name: 'load',
        message: 'Load actual data?',
        choices: ['Yes', 'No'],
    })
    getLoad(value: string): string {
        return value;
    }

    @Question({
        type: 'list',
        name: 'calcOutput',
        message: 'Choice calc output',
        choices: ['Console', 'CSV', 'TradingView'],
    })
    getCalcOutput(value: string): string {
        return value;
    }

    @Question({
        type: 'list',
        name: 'verbose',
        message: 'Verbose logs required?',
        choices: ['No', 'Yes'],
        when: (answers) => answers['calcOutput'] === 'Console',
    })
    getVerbose(value: string): string {
        return value;
    }

    @Question({
        type: 'list',
        name: 'withOrders',
        message: 'Logs for orders required?',
        choices: ['No', 'Yes'],
        when: (answers) => answers['calcOutput'] === 'Console',
    })
    getWithOrders(value: string): string {
        return value;
    }

    @Question({
        name: 'riskLevel',
        message: 'Choice risk level (1 - 33)',
        default: '33',
    })
    getRiskLevel(value: string): string {
        return value;
    }

    @Question({
        name: 'from',
        message: 'Choice start year',
        default: '2018',
    })
    getFrom(value: string): string {
        return value;
    }

    @Question({
        name: 'to',
        message: 'Choice end year',
        default: '2050',
    })
    getTo(value: string): string {
        return value;
    }
}
