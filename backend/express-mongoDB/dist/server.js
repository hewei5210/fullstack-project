"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = __importDefault(require("./config/database"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./src/routes/auth"));
const users_1 = __importDefault(require("./src/routes/users"));
const translations_1 = __importDefault(require("./src/routes/translations"));
const csvSync_1 = __importDefault(require("./src/routes/csvSync"));
dotenv_1.default.config();
const app = (0, express_1.default)();
(0, database_1.default)();
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "http://223.6.250.152",
        "https://223.6.250.152",
        "https://frontendtool.top",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.get("/health", (req, res) => {
    res.status(200).json({
        status: 200,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});
app.use("/api", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api", translations_1.default);
app.use("/api/csv-sync", csvSync_1.default);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 500,
        message: "服务器内部错误",
        data: "",
    });
});
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: "接口不存在",
        data: "",
    });
});
const PORT = process.env.PORT || 3000;
console.log('正在启动服务器...');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
console.log('PORT:', PORT);
app.listen(PORT, () => {
    console.log(`服务器已启动，正在监听端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
});
//# sourceMappingURL=server.js.map