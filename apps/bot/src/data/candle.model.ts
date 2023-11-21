import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum EHmaType {
    MICRO_HMA = 'microHma',
    HMA = 'hma',
    MID_HMA = 'midHma',
    BIG_HMA = 'bigHma',
}

@Entity()
export class CandleModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column('integer')
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
    microHma: number;

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
