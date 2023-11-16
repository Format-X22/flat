import { DateInput, DateTime, Duration, Interval } from 'luxon';

export function seconds(seconds: number): number {
    return Duration.fromObject({ seconds }).toMillis();
}

export function minutes(minutes: number): number {
    return Duration.fromObject({ minutes }).toMillis();
}

export function hours(hours: number): number {
    return Duration.fromObject({ hours }).toMillis();
}

export function days(days: number): number {
    return Duration.fromObject({ days }).toMillis();
}

export function years(years: number): number {
    return Duration.fromObject({ years }).toMillis();
}

export function interval(from: DateInput, to: DateInput): number {
    return Interval.fromDateTimes(from, to).length();
}

export function intervalToNow(from: DateInput): number {
    return interval(from, DateTime.now());
}
