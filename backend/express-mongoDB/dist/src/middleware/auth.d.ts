import { Response, NextFunction } from 'express';
import { IAuthenticatedRequest } from '../types';
declare const authMiddleware: (req: IAuthenticatedRequest, res: Response, next: NextFunction) => void;
export default authMiddleware;
//# sourceMappingURL=auth.d.ts.map