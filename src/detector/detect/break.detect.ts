import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';

export class BreakDetect extends AbstractDetect {
    profitMul = 2.3;
    enterFib = 0;
    takeFib = 0;
    stopFib = 0;

    check(): boolean {
        const [current, prev1, prev2, prev3, prev4] = this.getSegments(5);

        if (!prev4) {
            return false;
        }

        let lastUpWaveMax;
        let lastDownWaveMin;
        let last2DownWaveMin;
        let currentUpWaveMax;
        let fib5;
        let fib62;
        let candlesForFibCheck;
        let someCandleInFib5AndNotOverflow = false;
        let someCandleInFib5 = false;

        if (this.isSegmentUp(current)) {
            lastUpWaveMax = this.max(prev1, prev2);
            lastDownWaveMin = this.min(current, prev1);
            last2DownWaveMin = this.min(prev2, prev3);
            fib5 = this.getFib(this.segmentMax(current), lastDownWaveMin, 0.5, true);
            fib62 = this.getFib(lastDownWaveMin, this.segmentMax(current), 0.62, false);
            candlesForFibCheck = current.candles;
        } else {
            lastUpWaveMax = this.max(prev2, prev3);
            lastDownWaveMin = this.min(prev1, prev2);
            last2DownWaveMin = this.min(prev3, prev4);
            currentUpWaveMax = this.max(current, prev1);
            fib5 = this.getFib(currentUpWaveMax, lastDownWaveMin, 0.5, true);
            fib62 = this.getFib(lastDownWaveMin, currentUpWaveMax, 0.62, false);
            candlesForFibCheck = [...prev1.candles, ...current.candles];
        }

        for (const item of candlesForFibCheck) {
            if (!someCandleInFib5 && this.gt(this.candleMin(item), fib5)) {
                someCandleInFib5 = true;
                someCandleInFib5AndNotOverflow = true;
            }

            if (someCandleInFib5 && someCandleInFib5AndNotOverflow && this.lte(this.candleMin(item), fib62)) {
                someCandleInFib5AndNotOverflow = false;
            }
        }

        if (
            this.gt(this.segmentMax(current), lastUpWaveMax) &&
            this.gt(lastDownWaveMin, last2DownWaveMin) &&
            someCandleInFib5AndNotOverflow
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
        }
    }

    trade() {
        // TODO -
    }
}

export class UpBreakDetect extends BreakDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BREAK', true, segmentService, detectorService);
    }
}

export class DownBreakDetect extends BreakDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BREAK', false, segmentService, detectorService);
    }
}
