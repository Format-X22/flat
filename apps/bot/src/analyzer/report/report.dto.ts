import { ESide } from '../detector/detector.dto';

type TTimestamp = number;
type TDetectorName = string;
type TRiskReward = number;
type TValue = number;
type TCount = number;

export type TReportItem =
    | TReportConcurrentOrder
    | TReportPlaceOrder
    | TReportCancelOrder
    | TReportDetectedStart
    | TReportDetectedEnd
    | TReportEnterPosition
    | TReportExitPosition
    | TReportDealProfit
    | TReportDealPartial
    | TReportDealZero
    | TReportDealFail
    | TReportRewards
    | TReportCapital;

export enum ESize {
    SMALL = 'SMALL',
    MID = 'MID',
    BIG = 'BIG',
}

export enum ETWColor {
    RED = 'red',
    GREEN = 'green',
    BLUE = 'blue',
    FUCHSIA = 'fuchsia',
    ORANGE = 'orange',
}

export enum EReportItemType {
    CONCURRENT_ORDER = 'CONCURRENT_ORDER',
    PLACE_ORDER = 'PLACE_ORDER',
    CANCEL_ORDER = 'CANCEL_ORDER',
    DETECTED_START = 'DETECTED_START',
    DETECTED_END = 'DETECTED_END',
    ENTER_POSITION = 'ENTER_POSITION',
    EXIT_POSITION = 'EXIT_POSITION',
    DEAL_PROFIT = 'DEAL_PROFIT',
    DEAL_PARTIAL = 'DEAL_PARTIAL',
    DEAL_ZERO = 'DEAL_ZERO',
    DEAL_FAIL = 'DEAL_FAIL',
    REWARDS = 'REWARDS',
    CAPITAL = 'CAPITAL',
}

export type TReportConcurrentOrder = {
    type: EReportItemType.CONCURRENT_ORDER;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    concurrentName: TDetectorName;
    side: ESide;
    size: ESize;
};

export type TReportPlaceOrder = {
    type: EReportItemType.PLACE_ORDER;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
    riskReward: TRiskReward;
};

export type TReportCancelOrder = {
    type: EReportItemType.CANCEL_ORDER;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
};

export type TReportDetectedStart = {
    type: EReportItemType.DETECTED_START;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
    riskReward: TRiskReward;
};

export type TReportDetectedEnd = {
    type: EReportItemType.DETECTED_END;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
};

export type TReportEnterPosition = {
    type: EReportItemType.ENTER_POSITION;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
    riskReward: TRiskReward;
};

export type TReportExitPosition = {
    type: EReportItemType.EXIT_POSITION;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
    riskReward: TRiskReward;
};

export type TReportDealProfit = {
    type: EReportItemType.DEAL_PROFIT;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
    riskReward: TRiskReward;
    value: TValue;
};

export type TReportDealPartial = {
    type: EReportItemType.DEAL_PARTIAL;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
    riskReward: TRiskReward;
    value: TValue;
};

export type TReportDealZero = {
    type: EReportItemType.DEAL_ZERO;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
    riskReward: TRiskReward;
    value: TValue;
};

export type TReportDealFail = {
    type: EReportItemType.DEAL_FAIL;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    side: ESide;
    size: ESize;
    riskReward: TRiskReward;
    value: TValue;
};

export type TReportRewards = {
    type: EReportItemType.REWARDS;
    detectorName: TDetectorName;
    value: TValue;
};

export type TReportCapital = {
    type: EReportItemType.CAPITAL;
    value: TValue;
    profit: TCount;
    partial: TCount;
    zero: TCount;
    fail: TCount;
};

export type TCsvRecordLine = {
    type: EReportItemType;
    timestamp: TTimestamp;
    detectorName: TDetectorName;
    concurrentName: TDetectorName;
    side: ESide;
    size: ESize;
    riskReward: TRiskReward;
    value: TValue;
};

export const CSV_HEADERS: Record<keyof TCsvRecordLine, string> = {
    type: 'Type',
    timestamp: 'Timestamp',
    detectorName: 'Detector name',
    concurrentName: 'Concurrent name',
    side: 'Side',
    size: 'Size',
    riskReward: 'Risk / Reward',
    value: 'Value',
};
