import { Request } from 'express';
import { ForbiddenException } from '@nestjs/common';

export type TSession = string;
export type THeaders = {
    Authorization?: `Bearer ${TSession}`;
    authorization?: `Bearer ${TSession}`;
};

export function getHeadersFromRequest(request: Request): THeaders {
    const { headers } = request;

    if (!headers || (!headers.Authorization && !headers.authorization)) {
        throw new ForbiddenException('Empty session');
    }

    if (headers.authorization) {
        headers.Authorization = headers.authorization;

        delete headers.authorization;
    }

    return headers as THeaders;
}
