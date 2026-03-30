import { Request, Response, NextFunction } from 'express';
import { Document } from 'mongoose';
export interface IUser extends Document {
    _id: string;
    username: string;
    email?: string;
    phone?: string;
    password: string;
    role: 'admin' | 'user';
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export interface ITranslation extends Document {
    _id: string;
    id: string;
    source: string;
    target: {
        'zh-CN': string;
        'en-US': string;
        'zh-HK': string;
    };
    projectCode?: string[];
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IProjectTag {
    label: string;
    projectCode: string;
}
export interface ILoginRequest {
    username: string;
    password: string;
}
export interface ILoginResponse {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        email?: string;
        phone?: string;
        role: string;
    };
}
export interface IRefreshTokenRequest {
    refreshToken: string;
}
export interface IRefreshTokenResponse {
    token: string;
    refreshToken: string;
}
export interface IJwtPayload {
    userId: string;
    username: string;
    role: string;
    iat?: number;
    exp?: number;
}
export interface IAuthenticatedRequest extends Request {
    user?: {
        userId: string;
        username: string;
        role: string;
    };
}
export interface IApiResponse<T = any> {
    status: number;
    message: string;
    data: T;
}
export interface IPaginationQuery {
    page?: number;
    pageSize?: number;
    sort?: string;
    projectCodes?: string[];
}
export interface IPaginationResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface ISearchQuery extends IPaginationQuery {
    searchSelect?: string;
    searchContent?: string;
    exactMatch?: boolean;
    projectCodes?: string[];
}
export interface ICreateTranslation {
    id?: string;
    target: {
        'zh-CN': string;
        'en-US': string;
        'zh-HK': string;
    };
    projectCode?: string[];
}
export interface IUpdateTranslation {
    id: string;
    source?: string;
    target: {
        'zh-CN': string;
        'en-US': string;
        'zh-HK': string;
    };
    projectCode?: string[];
}
export interface IBatchCreateTranslations {
    translations: ICreateTranslation[];
}
export interface IBatchUpdateTranslations {
    translations: IUpdateTranslation[];
}
export interface IBatchDeleteTranslations {
    ids: string[];
}
export interface IExportQuery {
    langType: 'zh-CN' | 'en-US' | 'zh-HK';
    projectCodes?: string[];
}
export interface ICSVSyncRequest {
    action: 'import' | 'export' | 'stats' | 'clean';
    file?: Express.Multer.File;
}
export interface IAppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export type MiddlewareFunction = (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;
export type RouteHandler = (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;
//# sourceMappingURL=index.d.ts.map