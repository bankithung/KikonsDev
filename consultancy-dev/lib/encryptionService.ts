/**
 * Client-Side Encryption Service for End-to-End Encrypted Chat
 * Uses RSA + AES hybrid encryption matching the backend implementation
 * 
 * NOTE: For production use, RSA key generation should happen server-side
 * with proper password-based encryption of private keys. This is a simplified
 * implementation for demonstration.
 */

import CryptoJS from 'crypto-js';
import forge from 'node-forge';

export class ClientEncryptionService {
    /**
     * Generate RSA key pair for a user (2048-bit)
     * In production, this should be done server-side with password protection
     */
    static generateKeyPair(): { publicKey: string; privateKey: string } {
        const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });

        return {
            publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
            privateKey: forge.pki.privateKeyToPem(keypair.privateKey)
        };
    }

    /**
     * Encrypt a message with AES, then encrypt the AES key with recipients' RSA public keys
     * This matches the backend MessageEncryptionService.encrypt_message
     * 
     * @param content - Plain text message  
     * @param recipientPublicKeys - Map of userId to PEM public key
     * @returns Object with encrypted_content and encrypted_keys
     */
    static encryptMessage(
        content: string,
        recipientPublicKeys: Record<string, string>
    ): { encrypted_content: string; encrypted_keys: Record<string, string> } {
        // Generate random AES key (256-bit) and IV (128-bit)
        const aesKey = CryptoJS.lib.WordArray.random(32); // 32 bytes = 256 bits
        const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes = 128 bits

        // Encrypt content with AES-CBC
        const encrypted = CryptoJS.AES.encrypt(content, aesKey, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // Combine IV and encrypted content (matching backend format)
        const encryptedData = iv.concat(encrypted.ciphertext);
        const encryptedContentB64 = CryptoJS.enc.Base64.stringify(encryptedData);

        // Encrypt AES key for each recipient with their RSA public key
        const encryptedKeys: Record<string, string> = {};

        Object.entries(recipientPublicKeys).forEach(([userId, publicKeyPem]) => {
            try {
                // Load public key from PEM
                const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

                // Convert AES key to bytes
                const aesKeyBytes = forge.util.createBuffer(
                    CryptoJS.enc.Hex.parse(aesKey.toString()).toString(CryptoJS.enc.Latin1)
                ).getBytes();

                // Encrypt AES key with RSA-OAEP (matching backend)
                const encryptedAesKey = publicKey.encrypt(aesKeyBytes, 'RSA-OAEP', {
                    md: forge.md.sha256.create(),
                    mgf1: {
                        md: forge.md.sha256.create()
                    }
                });

                // Base64 encode the encrypted AES key
                encryptedKeys[userId] = forge.util.encode64(encryptedAesKey);
            } catch (error) {
                console.error(`Failed to encrypt for user ${userId}:`, error);
                throw new Error(`Failed to encrypt message for recipient ${userId}`);
            }
        });

        return {
            encrypted_content: encryptedContentB64,
            encrypted_keys: encryptedKeys
        };
    }

    /**
     * Decrypt a message using user's private key
     * This matches the backend MessageEncryptionService.decrypt_message
     * 
     * @param encryptedContentB64 - Base64 encoded encrypted content (IV + ciphertext)
     * @param encryptedAesKeyB64 - Base64 encoded encrypted AES key for this user
     * @param privateKeyPem - User's private key in PEM format
     * @returns Decrypted plain text message
     */
    static decryptMessage(
        encryptedContentB64: string,
        encryptedAesKeyB64: string,
        privateKeyPem: string
    ): string {
        try {
            // Load private key from PEM
            const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

            // Decrypt AES key with RSA
            const encryptedAesKey = forge.util.decode64(encryptedAesKeyB64);
            const aesKeyBytes = privateKey.decrypt(encryptedAesKey, 'RSA-OAEP', {
                md: forge.md.sha256.create(),
                mgf1: {
                    md: forge.md.sha256.create()
                }
            });

            // Convert decrypted AES key bytes to CryptoJS WordArray
            const aesKeyHex = forge.util.bytesToHex(aesKeyBytes);
            const aesKey = CryptoJS.enc.Hex.parse(aesKeyHex);

            // Decode encrypted content (IV + ciphertext)
            const encryptedData = CryptoJS.enc.Base64.parse(encryptedContentB64);

            // Extract IV (first 16 bytes) and ciphertext (rest)
            const iv = CryptoJS.lib.WordArray.create(encryptedData.words.slice(0, 4)); // 4 words = 16 bytes
            const ciphertext = CryptoJS.lib.WordArray.create(encryptedData.words.slice(4));

            // Decrypt content with AES-CBC
            const decrypted = CryptoJS.AES.decrypt(
                { ciphertext } as any,
                aesKey,
                {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }
            );

            // Convert to UTF-8 string
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt message');
        }
    }

    /**
     * Helper: Check if user has encryption keys set up
     */
    static hasKeys(publicKey?: string | null, privateKey?: string | null): boolean {
        return Boolean(publicKey && privateKey);
    }

    /**
     * Helper: Store keys in localStorage (NOT SECURE - for demo only)
     * In production, private keys should NEVER be stored in localStorage
     * They should be encrypted with user's password and stored server-side
     */
    static storeKeys(publicKey: string, privateKey: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('chat_public_key', publicKey);
            // WARNING: Storing private key in localStorage is NOT secure
            // This is for demonstration only
            localStorage.setItem('chat_private_key', privateKey);
        }
    }

    /**
     * Helper: Retrieve keys from localStorage
     */
    static getStoredKeys(): { publicKey: string | null; privateKey: string | null } {
        if (typeof window !== 'undefined') {
            return {
                publicKey: localStorage.getItem('chat_public_key'),
                privateKey: localStorage.getItem('chat_private_key')
            };
        }
        return { publicKey: null, privateKey: null };
    }
}
