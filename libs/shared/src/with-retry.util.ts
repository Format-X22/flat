import { Logger } from '@nestjs/common';
import { sleep } from '@app/shared/sleep.util';

export type TCallWithRetryArgs<TData> = {
    fn: () => Promise<TData>;
    onErrorFn?: () => Promise<void>;
    isStoppedFn?: () => boolean;
    retryTimeout?: number;
    logger: Logger;
    errorPrefix: string;
};
export type TLoopWithRetryArgs<TData> = TCallWithRetryArgs<TData> & {
    beforeFn?: () => Promise<void>;
    afterFn?: () => Promise<void>;
    nextCallTimeout?: number;
};
type TIsOnce = { isOnce: boolean };
type TWithRetryArgs<TData> = TLoopWithRetryArgs<TData> & TIsOnce;

export async function callWithRetry<TData>(args: TCallWithRetryArgs<TData>): Promise<TData> {
    return withRetry<TData>({ ...args, isOnce: true });
}

export function loopWithRetry<TData>(args: TLoopWithRetryArgs<TData>): void {
    withRetry({ ...args, isOnce: false }).catch();
}

async function withRetry<TData = void>({
    fn,
    onErrorFn,
    beforeFn,
    afterFn,
    isStoppedFn,
    nextCallTimeout = 0,
    retryTimeout = nextCallTimeout,
    logger,
    errorPrefix,
    isOnce,
}: TWithRetryArgs<TData>): Promise<TData> {
    while (true) {
        if (isStoppedFn?.()) {
            return;
        }

        let isError = false;
        let timeout = nextCallTimeout;
        let result: TData;

        try {
            await beforeFn?.();
        } catch (error) {
            logger.error(`[Before fn] ${errorPrefix} - ${error}`);
        }

        try {
            result = await fn();
        } catch (error) {
            isError = true;
            timeout = retryTimeout;

            logger.error(`[Main fn] ${errorPrefix} - ${error}`);

            try {
                await onErrorFn?.();
            } catch (error) {
                logger.error(`[OnError fn] ${errorPrefix} - ${error}`);
            }
        }

        try {
            await afterFn?.();
        } catch (error) {
            logger.error(`[After fn] ${errorPrefix} - ${error}`);
        }

        if (isOnce && !isError) {
            return result;
        }

        await sleep(timeout);
    }
}
