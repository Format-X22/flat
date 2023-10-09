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

    @Column('bigint')
    timestamp: number;

    @Column()
    dateString: string;

    @Column('float')
    open: number;

    @Column('float')
    high: number;

    @Column('float')
    low: number;

    @Column('float')
    close: number;

    @Column('float', { nullable: true })
    microHma: number;

    @Column('float')
    hma: number;

    @Column('float')
    midHma: number;

    @Column('float')
    bigHma: number;

    @Index()
    @Column()
    size: string;
}
