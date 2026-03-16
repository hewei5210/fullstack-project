import { Request, Response, NextFunction } from 'express';
import { Document } from 'mongoose';

// 用户相关类型
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

// 翻译项相关类型
export interface ITranslation extends Document {
  _id: string;
  id: string;
  source: string;
  target: {
    'zh-CN': string;
    'en-US': string;
    'zh-HK': string;
  };
  /** 所属项目，数组存储 projectCode；空数组表示属于所有项目 */
  projectCode?: string[];
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 项目标签（用于下拉选项）
export interface IProjectTag {
  label: string;
  projectCode: string;
}

// 认证相关类型
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

// JWT载荷类型
export interface IJwtPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// 请求扩展类型
export interface IAuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

// 响应类型
export interface IApiResponse<T = any> {
  status: number;
  message: string;
  data: T;
}

// 分页类型
export interface IPaginationQuery {
  page?: number;
  pageSize?: number;
  sort?: string;
  /** 按所属项目筛选，不传或空则不过滤 */
  projectCodes?: string[];
}

export interface IPaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 搜索类型
export interface ISearchQuery extends IPaginationQuery {
  searchSelect?: string;
  searchContent?: string;
  exactMatch?: boolean; // 精准搜索开关
  projectCodes?: string[];
}

// 翻译项操作类型
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

// 批量操作类型
export interface IBatchCreateTranslations {
  translations: ICreateTranslation[];
}

export interface IBatchUpdateTranslations {
  translations: IUpdateTranslation[];
}

export interface IBatchDeleteTranslations {
  ids: string[];
}

// 导出类型
export interface IExportQuery {
  langType: 'zh-CN' | 'en-US' | 'zh-HK';
  projectCodes?: string[];
}

// CSV同步类型
export interface ICSVSyncRequest {
  action: 'import' | 'export' | 'stats' | 'clean';
  file?: Express.Multer.File;
}

// 错误类型
export interface IAppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// 中间件类型
export type MiddlewareFunction = (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// 路由处理器类型
export type RouteHandler = (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;
