import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { ETicker } from '../bot.types';

export enum EHmaType {
    HMA = 'hma',
    MID_HMA = 'midHma',
    BIG_HMA = 'bigHma',
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
    hma: number;

    @Column('real')
    midHma: number;

    @Column('real')
    bigHma: number;

    @Index()
    @Column()
    size: string;
}
