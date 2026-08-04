type TokenType = "access" | "refresh";
export interface AuthTokenPayload {
    userId: string;
    type: TokenType;
    tokenVersion?: number;
}
export declare function generateAccessToken(userId: string): string;
export declare function generateRefreshToken(userId: string, tokenVersion: number): string;
export declare function verifyAccessToken(token: string): AuthTokenPayload;
export declare function verifyRefreshToken(token: string): {
    tokenVersion: number;
    userId: string;
    type: TokenType;
};
export {};
