import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

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

    @Column('float')
    hma: number;

    @Index()
    @Column()
    size: string;
}