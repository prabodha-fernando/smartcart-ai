import { type HydratedDocument, type Model } from "mongoose";
export interface IUser {
    name: string;
    email: string;
    password: string;
    tokenVersion: number;
}
export interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export type UserDocument = HydratedDocument<IUser, IUserMethods>;
type UserModel = Model<IUser, Record<string, never>, IUserMethods>;
export declare const User: UserModel;
export {};
