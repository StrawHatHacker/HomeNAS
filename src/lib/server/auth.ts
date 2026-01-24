import { AUDIENCE, ISSUER, PRIVATE_KEY } from '$env/static/private';
import { COOKIES, ROUTES } from '$lib/types';
import crypto from 'node:crypto';
import { V4 } from 'paseto';
import * as Queries from './queries';
import { error, redirect, type Cookies } from '@sveltejs/kit';
import { PUBLIC_ENV } from '$env/static/public';
import { isRateLimited } from './utils/rateLimit';
import { errorMap } from './errorMap';

type Payload = {
    uid: number;
    sid: string;
}

type Claims = Payload & {
    iat: number;
    exp: number;
    aud: string;
    iss: string;
}

const payloadOptions = {
    expiresIn: '1d',
    issuer: ISSUER,
    audience: AUDIENCE
};

export class Auth {
    static random(length = 16) {
        const values = crypto.getRandomValues(new Uint8Array(length));
        return Buffer.from(values).toString('hex');
    }

    static async createSessionToken(userId: number) {
        const sessionId = this.random();

        const token = await V4.sign(
            { uid: userId, sid: sessionId } as Payload,
            PRIVATE_KEY,
            payloadOptions
        );

        return token;
    }

    static async verifySessionToken(token: string) {
        try {
            const claims = await V4.verify(token, PRIVATE_KEY, {
                audience: AUDIENCE, issuer: ISSUER
            }) as Claims;

            return claims;
        } catch (error) {
            return null;
        }
    }

    /** 
    * Use only in x.server.ts files
    */
    static verifySession(cookies: Cookies) {
        const sessionCookie = cookies.get(COOKIES.session);
        if (!sessionCookie || sessionCookie == "") throw redirect(302, ROUTES.home);

        const dbSession = Queries.getSession(sessionCookie);
        if (!dbSession) throw redirect(302, ROUTES.home);

        return dbSession;
    }

    static deleteSessions(sessionCookies: (string | undefined)[]) {
        for (const sc of sessionCookies) {
            if (!sc) continue;
            Queries.deleteSessionByToken(sc);
        }
    }

    static async checkRatelimit(request: Request, getClientAddress: () => string, strict?: boolean) {
        const ip = Auth.getClientIp(request, getClientAddress);

        if (PUBLIC_ENV !== 'DEV') {
            const isLimited = isRateLimited(ip, { strict });
            if (isLimited) return error(429, errorMap.tooManyRequests);
        }
    }

    static getClientIp(request: Request, getClientAddress: () => string) {
        const xff = request.headers.get('x-forwarded-for');
        if (xff) {
            return xff.split(',')[0].trim();
        }
        return getClientAddress();
    }
}
