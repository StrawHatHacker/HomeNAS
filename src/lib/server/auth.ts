import crypto from 'node:crypto';

export class Auth {
    static random(length = 16) {
        const values = crypto.getRandomValues(new Uint8Array(length));
        return Buffer.from(values).toString('hex');
    }
}