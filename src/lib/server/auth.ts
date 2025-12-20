import { AUDIENCE, ISSUER, PRIVATE_KEY } from '$env/static/private';
import crypto from 'node:crypto';
import { V4 } from 'paseto';

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
}
