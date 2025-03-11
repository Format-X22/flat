import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { ETicker } from '../bot.types';

export enum EHmaType {
    HMA_3 = 'hma_3',
    HMA_5 = 'hma_5',
    HMA_7 = 'hma_7',
    HMA_9 = 'hma_9',
    HMA_14 = 'hma_14',
    HMA_21 = 'hma_21',
    HMA_30 = 'hma_30',
    HMA_45 = 'hma_45',
    HMA_60 = 'hma_60',
    HMA_100 = 'hma_100',
}

@Entity()
export class CandleModel {
    @PrimaryColumn('varchar')
    id: string;

    @Index()
    @Column('varchar')
    ticker: ETicker;

    @Index()
    @Column('float')
    timestamp: number;

    @Column()
    dateString: string;

    @Column('real')
    open: number;

    @Column('real')
    high: number;

    @Column('real')
    low: number;

    @Column('real')
    close: number;

    @Column('real')
    hma_3: number;

    @Column('real')
    hma_5: number;

    @Column('real')
    hma_7: number;

    @Column('real')
    hma_9: number;

    @Column('real')
    hma_14: number;

    @Column('real')
    hma_21: number;

    @Column('real')
    hma_30: number;

    @Column('real')
    hma_45: number;

    @Column('real')
    hma_60: number;

    @Column('real')
    hma_100: number;

    @Index()
    @Column()
    size: string;
}
