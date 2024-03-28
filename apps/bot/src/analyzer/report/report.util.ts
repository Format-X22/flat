import { EReportItemType, ETWColor, TReportItem } from './report.dto';
import { Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { join } from 'node:path';
import * as fs from 'fs';

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
        const path = this.getFilePath('trading-view.txt');
        const header = ['//@version=5', "indicator('Plotter', 'Plotter', true, max_labels_count = 500)"];
        const lines: Array<string> = [];

        for (const item of this.data) {
            switch (item.type) {
                case EReportItemType.ENTER_POSITION:
                    lines.push(this.makeTWPlot(item.timestamp, item.detectorName, ETWColor.BLUE, 1.03));
                    break;
                case EReportItemType.DEAL_PROFIT:
                    lines.push(this.makeTWPlot(item.timestamp, 'PR', ETWColor.GREEN, 1.1));
                    break;
                case EReportItemType.DEAL_PARTIAL:
                    lines.push(this.makeTWPlot(item.timestamp, 'PA', ETWColor.FUCHSIA, 1.1));
                    break;
                case EReportItemType.DEAL_ZERO:
                    lines.push(this.makeTWPlot(item.timestamp, 'ZE', ETWColor.ORANGE, 1.1));
                    break;
                case EReportItemType.DEAL_FAIL:
                    lines.push(this.makeTWPlot(item.timestamp, 'FA', ETWColor.RED, 1.1));
                    break;
            }
        }

        fs.writeFileSync(path, [...header, ...lines].join('\n'));
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

    private getFilePath(fileName: string): string {
        return join(__dirname, '..', '..', '..', 'report', fileName);
    }

    private makeTWPlot(timestamp: number, text: string, color: ETWColor, offset: number): string {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        text = text
            .replace('Down', 'v')
            .replace('Up', '^')
            .replace('Mid', 'M:')
            .replace('Big', 'B:')
            .replace('Break', 'Brk')
            .replace('Double', 'Dob')
            .replace('Pennant', 'Pen')
            .replace('Restart', 'Res')
            .replace('Triangle', 'Tri')
            .replace('Zigzag', 'Zig')
            .replace('Flag', 'Fla');

        return [
            `if (time == timestamp("UTC", ${year}, ${month}, ${day}))`,
            `    label.new(bar_index, high * ${offset}, '${text}', color = color.${color}, textcolor = color.white)`,
        ].join('\n');
    }
}
