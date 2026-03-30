import mongoose from "mongoose";
export interface IOperationLogItem {
    translationId?: string;
    prevSource?: string;
    prevEnUS?: string;
    prevZhHK?: string;
    prevProjectCode?: string[];
    source?: string;
    enUS?: string;
    zhHK?: string;
    projectCode?: string[];
}
export interface IOperationLog extends mongoose.Document {
    username: string;
    operationType: string;
    summary?: string;
    detailItems: IOperationLogItem[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IOperationLog, {}, {}, {}, mongoose.Document<unknown, {}, IOperationLog> & IOperationLog & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=OperationLog.d.ts.map