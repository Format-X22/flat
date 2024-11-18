import { AbstractDetect } from './abstract.detect';

export class LinerDetect extends AbstractDetect {
    protected enterFib = 0.62;
    protected takeFib = 2;
    protected stopFib = 0.33;

    protected waitDays = 365;

    check(): boolean {
        const [down0, up1, down1, up2] = this.getWaves(6, false);

        if (!up2) {
            return;
        }

        const maxAngel = this.getFibByValue(down1.min, up1.max, 1.2);

        if (this.lt(down0.min, maxAngel)) {
            return;
        }

        // TODO Shift candles by one to left
        // TODO Filtrate 0.5 fib

        let firstCandleMin = this.candleMin(down1.candles[0]);
        let firstCandleIndex = 0;
        const lastCandleMin = down0.min;
        let lastCandleIndex = down1.candles.length;

        for (let i = 1; i < down1.candles.length; i++) {
            const candleMin = this.candleMin(down1.candles[i]);

            if (this.lt(candleMin, firstCandleMin)) {
                firstCandleMin = candleMin;
                firstCandleIndex = i;
            }
        }

        for (let i = 1; i < down0.candles.length; i++) {
            const candleMin = this.candleMin(down0.candles[i]);

            if (this.lte(candleMin, lastCandleMin)) {
                lastCandleIndex = i + down1.candles.length;
            }
        }

        const allCandles = [...down1.candles, ...down0.candles];
        let found = false;
        let length = 0;
        let stepDiff = 0;

        let currentFirstCandleMin = firstCandleMin;
        let currentFirstCandleIndex = firstCandleIndex;
        let currentLastCandleIndex = lastCandleIndex;
        let currentLastCandleMin = lastCandleMin;

        while (!found) {
            if (currentFirstCandleIndex >= lastCandleIndex) {
                break;
            }

            moveLast: while (!found) {
                if (currentLastCandleIndex >= allCandles.length) {
                    break;
                }

                length = currentLastCandleIndex - currentFirstCandleIndex;
                stepDiff = Math.abs(currentLastCandleMin - currentFirstCandleMin) / length;

                let level = currentFirstCandleMin;

                for (let i = currentFirstCandleIndex + 1; i < allCandles.length; i++) {
                    if (currentFirstCandleMin < currentLastCandleMin) {
                        level += stepDiff;
                    } else {
                        level -= stepDiff;
                    }

                    if (this.lt(this.candleMin(allCandles[i]), level)) {
                        currentLastCandleIndex++;

                        if (currentLastCandleIndex >= allCandles.length) {
                            break moveLast;
                        }

                        currentLastCandleMin = this.candleMin(allCandles[currentLastCandleIndex]);
                        continue moveLast;
                    }
                }

                found = true;
            }

            if (!found) {
                currentFirstCandleIndex++;

                if (currentFirstCandleIndex >= lastCandleIndex) {
                    break;
                }

                currentFirstCandleMin = this.candleMin(allCandles[currentFirstCandleIndex]);
                currentLastCandleIndex = lastCandleIndex;
                currentLastCandleMin = lastCandleMin;
            }
        }

        if (this.debugHere('12-11-2023', true) && this.name === 'UpMidLiner') {
            console.log(
                found,
                currentFirstCandleIndex,
                currentFirstCandleMin,
                currentLastCandleMin,
                currentLastCandleIndex,
                length,
                stepDiff,
            );
        }

        return false;
    }
}

export class Up extends LinerDetect {}
export class Down extends LinerDetect {}
export class UpMid extends LinerDetect {}
export class DownMid extends LinerDetect {}
export class UpBig extends LinerDetect {}
export class DownBig extends LinerDetect {}
