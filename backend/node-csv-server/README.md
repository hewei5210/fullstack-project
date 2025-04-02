# 概述

- 本项目先是本地运行，使用 Node.js 实现一个手动控制的事务实现，管理本地的资源对象。
- 资源使用 csv 格式存储数据，作为持久化方式。
- 如果实现不理想，可以改用 SQLite 轻量级数据库作为本地持久化的中间件。对于后续是方便的，否则对于任何资源文件的写操作，都需要事务控制。

# 目录

- data 放置资源文件
- interface 放置访问的接口
- scripts 放置操作资源文件的服务（对资源的写操作需要具备事务控制能力）

# 接口

```sh
# 获取词条列表
curl -X GET http://localhost:3000/api/getBingList \
-H "Content-Type: application/json"

# 新增词条翻译项
curl -X POST http://localhost:3000/api/addBing \
-H "Content-Type: application/json" \
-d '{"id": "", "source": "请输入", "target": {"en-US": "please input"}}'

# 编辑词条翻译项
curl -X PUT http://localhost:3000/api/updateBing \
-H "Content-Type: application/json" \
-d '{"id": "", "source": "请输入", "target": {"en-US": "please input"}}'

# 删除词条
curl -X DELETE http://localhost:3000/api/del \
-H "Content-Type: application/json" \
-d '{"id": ""}'
```