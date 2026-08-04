/**
 * Encrypts a payload asynchronously using a background worker thread.
 */
export declare function encryptPayloadAsync(payload: unknown): Promise<{
    iv: string;
    data: string;
}>;
/**
 * Decrypts a payload asynchronously using a background worker thread.
 */
export declare function decryptPayloadAsync(ivHex: string, encryptedHex: string): Promise<any>;
export declare function encryptPayload(payload: unknown): {
    iv: string;
    data: string;
};
export declare function decryptPayload(ivHex: string, encryptedHex: string): any;
