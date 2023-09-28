import { Test, TestingModule } from '@nestjs/testing';
import { TraderService } from './trader.service';

describe('TraderService', () => {
    let service: TraderService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TraderService],
        }).compile();

        service = module.get<TraderService>(TraderService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
