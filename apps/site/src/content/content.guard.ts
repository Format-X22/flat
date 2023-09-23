import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContentGuard implements CanActivate {
    constructor(private configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        return this.configService.get('F_SITE_ADMIN_KEY') === request.headers['admin-key'];
    }
}
