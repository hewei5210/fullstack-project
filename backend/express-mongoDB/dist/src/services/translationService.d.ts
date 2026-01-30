import ExcelJS from 'exceljs';
import { IPaginationQuery, IPaginationResponse, ISearchQuery, ICreateTranslation, IUpdateTranslation, ITranslation } from '../types';
declare class TranslationService {
    getList(query?: IPaginationQuery): Promise<IPaginationResponse<ITranslation>>;
    search(searchParams: ISearchQuery): Promise<IPaginationResponse<ITranslation>>;
    add(translationData: ICreateTranslation): Promise<ITranslation>;
    update(translationData: IUpdateTranslation): Promise<ITranslation>;
    delete(id: string): Promise<ITranslation>;
    generateNewId(): Promise<string>;
    exportJsonData(langType?: 'zh-CN' | 'en-US' | 'zh-HK'): Promise<{
        filePath: string;
        fileName: string;
        done: () => void;
    }>;
    downloadTemplate(): ExcelJS.Workbook;
    exportExcelData(includeId?: boolean): Promise<ExcelJS.Workbook>;
    batchImport(fileBuffer: Buffer, fileName?: string): Promise<{
        code: number;
        data: any;
        message: string;
    }>;
    downloadUpdateTemplate(): ExcelJS.Workbook;
    batchUpdate(fileBuffer: Buffer, fileName?: string): Promise<{
        code: number;
        data: any;
        message: string;
    }>;
    batchGetIds(fileBuffer: Buffer, fileName?: string): Promise<{
        code: number;
        data: any;
        message: string;
    }>;
    downloadGetIdsTemplate(): ExcelJS.Workbook;
    exportGetIdsResult(data: any[]): Promise<ExcelJS.Workbook>;
    downloadDeleteTemplate(): ExcelJS.Workbook;
    batchDelete(fileBuffer: Buffer, fileName?: string): Promise<{
        code: number;
        data: any;
        message: string;
    }>;
}
declare const _default: TranslationService;
export default _default;
//# sourceMappingURL=translationService.d.ts.map