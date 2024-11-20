import { AbstractDetect } from './abstract.detect';
import { Wave } from '../../wave/wave.util';

const LINE_LENGTH_SAFE_GAP = 3;

export class LinerDetect extends AbstractDetect {
    private lastDetectedEndWave: Wave = null;
    private lastEndLinePoint: number;

    protected enterFib = 1;
    protected takeFib = 4;
    protected stopFib = 0;

    protected waitDays = 365;

    check(): boolean {
        const [up0, down1, up1, down2] = this.getWaves(6, true);

        if (!down2) {
            this.markEndDetection();
            return;
        }

        const enterFib = this.getFibByValue(down1.min, up0.max, 0.5);
        const anyCandleUnderEnterFib = up0.candles.some((i) => this.gt(this.candleMin(i), enterFib));

        if (!anyCandleUnderEnterFib) {
            this.markEndDetection();
            return;
        }

        let firstCandleMin = this.candleMin(down2.candles[0]);
        let firstCandleIndex = 0;
        let lastCandleMin = this.candleMin(down1.candles[0]);
        let lastCandleIndex = down2.candles.length;

        for (let i = 1; i < down2.candles.length; i++) {
            const candleMin = this.candleMin(down2.candles[i]);

            if (this.lte(candleMin, firstCandleMin)) {
                firstCandleMin = candleMin;
                firstCandleIndex = i;
            }
        }

        for (let i = 1; i < down1.candles.length; i++) {
            const candleMin = this.candleMin(down1.candles[i]);

            if (this.lte(candleMin, lastCandleMin)) {
                lastCandleMin = candleMin;
                lastCandleIndex = i + down2.candles.length;
            }
        }

        if (firstCandleIndex + LINE_LENGTH_SAFE_GAP >= lastCandleIndex) {
            this.markEndDetection();
            return;
        }

        const allCandles = [...down2.candles, ...down1.candles, ...up0.rightCandles];
        let found = false;
        let length = 0;
        let stepDiff = 0;

        let currentFirstCandleMin = firstCandleMin;
        let currentFirstCandleIndex = firstCandleIndex;
        let currentLastCandleIndex = lastCandleIndex;
        let currentLastCandleMin = lastCandleMin;

        moveFirst: while (true) {
            if (this.lt(currentFirstCandleMin, currentLastCandleMin)) {
                while (true) {
                    length = currentLastCandleIndex - currentFirstCandleIndex;
                    stepDiff = Math.abs(currentLastCandleMin - currentFirstCandleMin) / length;

                    let level = currentFirstCandleMin;
                    let collision = false;

                    for (let i = currentFirstCandleIndex + 1; i < allCandles.length; i++) {
                        if (currentFirstCandleMin < currentLastCandleMin) {
                            level += stepDiff;
                        } else {
                            level -= stepDiff;
                        }

                        if (this.lt(this.candleMin(allCandles[i]), level) && i !== currentLastCandleIndex) {
                            collision = true;
                            break;
                        }
                    }

                    if (!collision) {
                        found = true;

                        if (currentFirstCandleMin < currentLastCandleMin) {
                            this.enterPrice = level + stepDiff;
                        } else {
                            this.enterPrice = level - stepDiff;
                        }

                        this.stopPrice = up0.max;

                        if (this.isNotInverted) {
                            this.takePrice = this.stopPrice - (this.stopPrice - this.enterPrice) * 4;
                        } else {
                            this.takePrice = this.stopPrice + (this.enterPrice - this.stopPrice) * 4;
                        }

                        break moveFirst;
                    }

                    currentLastCandleIndex++;

                    if (currentLastCandleIndex === allCandles.length) {
                        break;
                    }

                    currentLastCandleMin = this.candleMin(allCandles[currentLastCandleIndex]);
                }
            }

            currentFirstCandleIndex++;

            if (currentFirstCandleIndex + LINE_LENGTH_SAFE_GAP >= lastCandleIndex) {
                break;
            }

            currentFirstCandleMin = this.candleMin(allCandles[currentFirstCandleIndex]);
            currentLastCandleIndex = lastCandleIndex;
            currentLastCandleMin = lastCandleMin;
        }

        if (found) {
            if (this.lastDetectedEndWave === up0 && this.lastEndLinePoint !== lastCandleMin) {
                this.markEndDetection();
            } else {
                this.lastDetectedEndWave = up0;
                this.lastEndLinePoint = lastCandleMin;
                this.markDetection();
            }
        } else {
            this.markEndDetection();
        }
    }
}

export class Up extends LinerDetect {}
export class Down extends LinerDetect {}
export class UpMid extends LinerDetect {}
export class DownMid extends LinerDetect {}
export class UpBig extends LinerDetect {}
export class DownBig extends LinerDetect {}
