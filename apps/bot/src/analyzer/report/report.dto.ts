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

export enum ESide {
    UP = 'UP',
    DOWN = 'DOWN',
}

export enum ESize {
    SMALL = 'SMALL',
    MID = 'MID',
    BIG = 'BIG',
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
    timestamp: number;
    detectorName: string;
    concurrentName: string;
    side: ESide;
    size: ESize;
};

export type TReportPlaceOrder = {
    type: EReportItemType.PLACE_ORDER;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
    riskReward: number;
};

export type TReportCancelOrder = {
    type: EReportItemType.CANCEL_ORDER;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
};

export type TReportDetectedStart = {
    type: EReportItemType.DETECTED_START;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
    riskReward: number;
};

export type TReportDetectedEnd = {
    type: EReportItemType.DETECTED_END;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
};

export type TReportEnterPosition = {
    type: EReportItemType.ENTER_POSITION;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
    riskReward: number;
};

export type TReportExitPosition = {
    type: EReportItemType.EXIT_POSITION;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
    riskReward: number;
};

export type TReportDealProfit = {
    type: EReportItemType.DEAL_PROFIT;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
    riskReward: number;
    value: number;
};

export type TReportDealPartial = {
    type: EReportItemType.DEAL_PARTIAL;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
    riskReward: number;
    value: number;
};

export type TReportDealZero = {
    type: EReportItemType.DEAL_ZERO;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
    riskReward: number;
    value: number;
};

export type TReportDealFail = {
    type: EReportItemType.DEAL_FAIL;
    timestamp: number;
    detectorName: string;
    side: ESide;
    size: ESize;
    riskReward: number;
    value: number;
};

export type TReportRewards = {
    type: EReportItemType.REWARDS;
    detectorName: string;
    value: number;
};

export type TReportCapital = {
    type: EReportItemType.CAPITAL;
    value: number;
    profit: number;
    partial: number;
    zero: number;
    fail: number;
};
