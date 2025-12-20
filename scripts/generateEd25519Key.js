import { generateKeyPairSync } from 'node:crypto';

(() => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');

    console.info({
        publicKey: publicKey.export({
            type: 'spki',    // SubjectPublicKeyInfo standard
            format: 'pem'
        }), privateKey: privateKey.export({
            type: 'pkcs8',   // PKCS#8 standard for private keys
            format: 'pem'
        })
    });
})();