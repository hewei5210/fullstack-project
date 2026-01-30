import { ILoginRequest, ILoginResponse, IRefreshTokenResponse, IJwtPayload } from '../types';
declare class AuthService {
    login(credentials: ILoginRequest): Promise<ILoginResponse>;
    verifyToken(token: string): IJwtPayload;
    refreshToken(refreshToken: string): Promise<IRefreshTokenResponse>;
    isTokenExpiringSoon(token: string): boolean;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=authService.d.ts.map