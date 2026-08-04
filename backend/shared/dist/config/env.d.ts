import "dotenv/config";
export declare const env: {
    NODE_ENV: "test" | "development" | "production";
    PORT: number;
    MONGODB_URI: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_EXPIRES: string;
    REFRESH_TOKEN_EXPIRES: string;
    ENCRYPTION_KEY: string;
    CORS_ORIGIN: string;
    DUMMYJSON_BASE_URL: string;
    NVIDIA_NIM_BASE_URL: string;
    NVIDIA_NIM_API_KEY: string;
    AI_RATE_LIMIT_PER_MINUTE: number;
};
export declare const corsOrigins: string[];
