import express, { Response } from "express";
import mongoose from "mongoose";
import authMiddleware from "../middleware/auth";
import OperationLog from "../models/OperationLog";
import { IAuthenticatedRequest, IApiResponse } from "../types";

const router = express.Router();

router.use(authMiddleware);

// 操作日志列表（支持日志ID、用户、操作类型、时间范围筛选）
router.get("/", async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const {
      page = "1",
      pageSize = "10",
      logId,
      username,
      operationType,
      startTime,
      endTime,
    } = req.query;

    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const size = Math.max(1, parseInt(pageSize as string, 10) || 10);

    const query: Record<string, any> = {};
    if (logId && String(logId).trim()) {
      const idStr = String(logId).trim();
      if (!mongoose.Types.ObjectId.isValid(idStr)) {
        const response: IApiResponse = {
          status: 200,
          message: "success",
          data: {
            data: [],
            total: 0,
            page: currentPage,
            pageSize: size,
            totalPages: 0,
          },
        };
        return res.status(200).json(response);
      }
      query._id = new mongoose.Types.ObjectId(idStr);
    }
    if (username && String(username).trim()) {
      query.username = String(username).trim();
    }
    if (operationType && String(operationType).trim()) {
      query.operationType = String(operationType).trim();
    }
    if (startTime || endTime) {
      query.createdAt = {};
      if (startTime) {
        query.createdAt.$gte = new Date(String(startTime));
      }
      if (endTime) {
        query.createdAt.$lte = new Date(String(endTime));
      }
    }

    const [list, total] = await Promise.all([
      OperationLog.find(query)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * size)
        .limit(size),
      OperationLog.countDocuments(query),
    ]);

    const response: IApiResponse = {
      status: 200,
      message: "success",
      data: {
        data: list.map((item) => ({
          id: item._id,
          username: item.username,
          operationType: item.operationType,
          summary: item.summary || "",
          detailCount: item.detailItems?.length || 0,
          createdAt: item.createdAt,
        })),
        total,
        page: currentPage,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
    };
    return res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : "查询操作日志失败",
      data: "",
    };
    return res.status(400).json(response);
  }
});

// 操作日志详情
router.get("/:id", async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const log = await OperationLog.findById(id);
    if (!log) {
      return res.status(404).json({
        status: 404,
        message: "日志不存在",
        data: "",
      });
    }

    const response: IApiResponse = {
      status: 200,
      message: "success",
      data: {
        id: log._id,
        username: log.username,
        operationType: log.operationType,
        summary: log.summary || "",
        detailItems: log.detailItems || [],
        createdAt: log.createdAt,
      },
    };
    return res.status(200).json(response);
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : "查询操作日志详情失败",
      data: "",
    });
  }
});

export default router;
