import mongoose, { Schema } from "mongoose";

export interface IOperationLogItem {
  translationId?: string;
  /** 编辑前（仅编辑类操作有值） */
  prevSource?: string;
  prevEnUS?: string;
  prevZhHK?: string;
  /** 编辑前所属项目 */
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

const OperationLogItemSchema = new Schema<IOperationLogItem>(
  {
    translationId: { type: String, default: "" },
    prevSource: { type: String, default: "" },
    prevEnUS: { type: String, default: "" },
    prevZhHK: { type: String, default: "" },
    prevProjectCode: { type: [String], default: [] },
    source: { type: String, default: "" },
    enUS: { type: String, default: "" },
    zhHK: { type: String, default: "" },
    projectCode: { type: [String], default: [] },
  },
  { _id: false }
);

const OperationLogSchema = new Schema<IOperationLog>(
  {
    username: {
      type: String,
      required: true,
      index: true,
    },
    operationType: {
      type: String,
      required: true,
      index: true,
    },
    summary: {
      type: String,
      default: "",
    },
    detailItems: {
      type: [OperationLogItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

OperationLogSchema.index({ createdAt: -1 });

export default mongoose.model<IOperationLog>("OperationLog", OperationLogSchema);
