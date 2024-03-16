export class InversionUtil {
    constructor(private readonly isNotInverted: boolean) {}

    bool(flag: boolean): boolean {
        return this.isNotInverted ? flag : !flag;
    }

    value<T1, T2>(a: T1, b: T2): T1 | T2 {
        return this.isNotInverted ? a : b;
    }

    fn<T1, T2>(a: () => T1, b: () => T2): T1 | T2 {
        return this.isNotInverted ? a() : b();
    }
}
