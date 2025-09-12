import mongoose, { Document, Schema } from 'mongoose';
import { ITranslation } from '../types';

const TranslationSchema = new Schema<ITranslation>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  source: {
    type: String,
    required: true
  },
  target: {
    'zh-CN': { type: String, required: true },
    'zh-HK': { type: String, required: true },
    'en-US': { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['ready', 'pending', 'error'],
    default: 'ready'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
TranslationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<ITranslation>('Translation', TranslationSchema);
