import { EReportItemType, TReportItem } from './report.dto';
import { Logger } from '@nestjs/common';
import { DateTime } from 'luxon';

export class ReportUtil {
    private logger: Logger = new Logger(ReportUtil.name);
    private data: Array<TReportItem> = [];

    add(item: TReportItem): void {
        this.data.push(item);
    }

    printTrade(types: Set<EReportItemType | 'ALL'>): void {
        const isAll = types.has('ALL');
        const lines: Array<string> = [''];

        for (const item of this.data) {
            if (!isAll && !types.has(item.type)) {
                continue;
            }

            let date;

            if ('timestamp' in item) {
                date = this.prettyDate(item.timestamp);
            }

            switch (item.type) {
                case EReportItemType.CONCURRENT_ORDER:
                    lines.push(`${date} Concurrent for [${item.detectorName}] from %${item.concurrentName}%`);
                    break;
                case EReportItemType.PLACE_ORDER:
                    lines.push(`${date} Place order [${item.detectorName}]`);
                    break;
                case EReportItemType.CANCEL_ORDER:
                    lines.push(`${date} Cancel order [${item.detectorName}]`);
                    break;
                case EReportItemType.DETECTED_START:
                    lines.push(`${date} Detection start [${item.detectorName}]`);
                    break;
                case EReportItemType.DETECTED_END:
                    lines.push(`${date} Detection end [${item.detectorName}]`);
                    break;
                case EReportItemType.ENTER_POSITION:
                    lines.push(`${date} > Enter position`);
                    break;
                case EReportItemType.EXIT_POSITION:
                    lines.push(`${date} < Exit position`);
                    break;
                case EReportItemType.DEAL_PROFIT:
                    lines.push(`${date} PROFIT - ${this.prettyNumber(item.value)}`);
                    break;
                case EReportItemType.DEAL_PARTIAL:
                    lines.push(`${date} PARTIAL - ${this.prettyNumber(item.value)}`);
                    break;
                case EReportItemType.DEAL_ZERO:
                    lines.push(`${date} ZERO - ${this.prettyNumber(item.value)}`);
                    break;
                case EReportItemType.DEAL_FAIL:
                    lines.push(`${date} FAIL - ${this.prettyNumber(item.value)}`);
                    break;
                case EReportItemType.REWARDS:
                    lines.push(`Reward for ${item.detectorName} is ${item.value.toFixed()}%`);
                    break;
                case EReportItemType.CAPITAL:
                    lines.push(
                        '',
                        `CAPITAL = ${this.prettyNumber(item.value)}`,
                        `Profit count: ${item.profit}`,
                        `Partial count: ${item.partial}`,
                        `Zero count: ${item.zero}`,
                        `Fail count: ${item.fail}`,
                        '',
                    );
                    break;
            }
        }

        this.logger.log(lines.join('\n'));
    }

    makeTradingViewScript(): void {
        // TODO -
    }

    makeCsvFile(): void {
        // TODO -
    }

    private prettyDate(timestamp: number): string {
        return DateTime.fromMillis(Number(timestamp)).toFormat('dd-MM-y HH');
    }

    private prettyNumber(value: number): string {
        return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
    }
}
