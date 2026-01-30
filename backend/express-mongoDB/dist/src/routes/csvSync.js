"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.use(auth_1.default);
router.post('/sync', async (req, res) => {
    try {
        const response = {
            status: 200,
            message: 'CSV同步功能待实现',
            data: {}
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 400,
            message: error instanceof Error ? error.message : 'CSV同步失败',
            data: ''
        };
        res.status(400).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=csvSync.js.map