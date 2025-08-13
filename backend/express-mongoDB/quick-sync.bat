@echo off
echo ========================================
echo CSV同步工具 - 快速启动
echo ========================================
echo.

echo 请选择操作:
echo 1. 同步CSV文件到MongoDB
echo 2. 导出数据到CSV
echo 3. 查看统计信息
echo 4. 清理重复数据
echo 5. 验证CSV文件
echo 6. 退出
echo.

set /p choice=请输入选择 (1-6): 

if "%choice%"=="1" goto sync
if "%choice%"=="2" goto export
if "%choice%"=="3" goto stats
if "%choice%"=="4" goto clean
if "%choice%"=="5" goto validate
if "%choice%"=="6" goto exit
goto invalid

:sync
echo.
echo 同步CSV文件到MongoDB
echo 默认文件路径: ../node-csv-server/data/bing.csv
set /p filepath=请输入CSV文件路径 (直接回车使用默认路径): 
if "%filepath%"=="" set filepath=../node-csv-server/data/bing.csv
echo.
echo 开始同步: %filepath%
node scripts/sync-csv.js sync "%filepath%" --update-existing
goto end

:export
echo.
echo 导出数据到CSV
set /p filename=请输入导出文件名 (默认: translations_export.csv): 
if "%filename%"=="" set filename=translations_export.csv
echo.
echo 开始导出: %filename%
node scripts/sync-csv.js export "%filename%"
goto end

:stats
echo.
echo 查看统计信息
node scripts/sync-csv.js stats
goto end

:clean
echo.
echo 清理重复数据
echo 警告: 此操作将删除重复的记录
set /p confirm=确认继续? (y/N): 
if /i "%confirm%"=="y" (
    node scripts/sync-csv.js clean
) else (
    echo 操作已取消
)
goto end

:validate
echo.
echo 验证CSV文件
echo 默认文件路径: ../node-csv-server/data/bing.csv
set /p filepath=请输入CSV文件路径 (直接回车使用默认路径): 
if "%filepath%"=="" set filepath=../node-csv-server/data/bing.csv
echo.
echo 开始验证: %filepath%
node scripts/sync-csv.js validate "%filepath%"
goto end

:invalid
echo.
echo 无效选择，请重新运行脚本
goto end

:exit
echo.
echo 再见!
exit /b 0

:end
echo.
echo 操作完成!
pause
