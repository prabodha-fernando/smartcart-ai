interface IAiRateLimit {
    key: string;
    windowStart: Date;
    count: number;
    expiresAt: Date;
}
export declare const AiRateLimit: import("mongoose").Model<IAiRateLimit, {}, {}, {}, import("mongoose").Document<unknown, {}, IAiRateLimit, {}, {}> & IAiRateLimit & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>;
export {};
