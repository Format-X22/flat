import { CSV_HEADERS, EReportItemType, ETWColor, TReportItem } from './report.dto';
import { Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { join } from 'node:path';
import * as fs from 'node:fs';
import { stringify as csv } from 'csv/sync';

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
        const path = this.getFilePath('analytics.csv');
        const headers = { ...CSV_HEADERS };
        const lines: Array<TReportItem> = [];

        for (const item of this.data) {
            switch (item.type) {
                case EReportItemType.CONCURRENT_ORDER:
                case EReportItemType.PLACE_ORDER:
                case EReportItemType.CANCEL_ORDER:
                case EReportItemType.DETECTED_START:
                case EReportItemType.DETECTED_END:
                case EReportItemType.ENTER_POSITION:
                case EReportItemType.EXIT_POSITION:
                case EReportItemType.DEAL_PROFIT:
                case EReportItemType.DEAL_PARTIAL:
                case EReportItemType.DEAL_ZERO:
                case EReportItemType.DEAL_FAIL:
                    lines.push(item);
            }
        }

        fs.writeFileSync(path, csv(lines, { header: true, columns: headers }));
    }

    makeRiskArrayFile(): void {
        const path = this.getFilePath('risk.txt');
        const lines: Array<string> = [];

        for (const item of this.data) {
            switch (item.type) {
                case EReportItemType.DEAL_PROFIT:
                case EReportItemType.DEAL_PARTIAL:
                case EReportItemType.DEAL_ZERO:
                case EReportItemType.DEAL_FAIL:
                    lines.push(item.riskReward.toFixed());
            }
        }

        fs.writeFileSync(path, lines.join('\n'));
    }

    makeProfitArrayFile(): void {
        const path = this.getFilePath('profit.txt');
        const lines: Array<string> = [];

        for (const item of this.data) {
            switch (item.type) {
                case EReportItemType.DEAL_PROFIT:
                case EReportItemType.DEAL_PARTIAL:
                case EReportItemType.DEAL_ZERO:
                case EReportItemType.DEAL_FAIL:
                    lines.push(item.value.toFixed());
            }
        }

        fs.writeFileSync(path, lines.join('\n'));
    }

    makeProfitByMonthArrayFile(): void {
        const path = this.getFilePath('profit-by-month.txt');
        const lines: Array<string> = [];
        let lastMonth = -1;

        for (const item of this.data) {
            switch (item.type) {
                case EReportItemType.DEAL_PROFIT:
                case EReportItemType.DEAL_PARTIAL:
                case EReportItemType.DEAL_ZERO:
                case EReportItemType.DEAL_FAIL:
                    const date = new Date(item.timestamp);
                    const month = date.getMonth();

                    if (lastMonth === -1) {
                        lastMonth = month;
                        lines.push(item.value.toFixed());
                        continue;
                    }

                    if (month === lastMonth) {
                        lines[lines.length - 1] = item.value.toFixed();
                    } else {
                        let pullDiff = 0;

                        if (month > lastMonth) {
                            pullDiff = month - lastMonth - 1;
                        } else {
                            pullDiff = 11 - lastMonth + month - 1;
                        }

                        for (let i = 0; i < pullDiff; i++) {
                            lines.push(item.value.toFixed());
                        }

                        lines.push(item.value.toFixed());
                        lastMonth = month;
                    }
            }
        }

        fs.writeFileSync(path, lines.join('\n'));
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
