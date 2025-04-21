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
curl -X DELETE http://localhost:3000/api/delBing \
-H "Content-Type: application/json" \
-d '{"id": ""}'

# 导出 json（zh-CN / zh-HK / en-US）
curl -O http://localhost:3000/api/exportBing?lang={langTag}
```
# 项目的待做功能
1、搜索列表的数据
2、指定id添加翻译项
3、将输入框改成文本框

# 项目存在的问题
## 2025/4/21，问题1
这些换行的一段话，再csv文件里面不能体现换行，是不是在数据库里面就能解决这个问题，至少是一条数据一行？
这个换行在列表中体现不出来。如果是一行一行的处理，是不是可以解决这个问题？
ccfe-000001460,"创建策略注意事项：
1.创建电脑策略后需要下发至对应的网络工作区，下发完成后才能将策略关联至网络工作区下的云电脑；
2.每台云电脑最多只能关联一条电脑策略，如需切换策略需要先将该电脑从原有策略中移除；
3.电脑策略各项兼容情况点击查看","创建策略注意事项：
1.创建电脑策略后需要下发至对应的网络工作区，下发完成后才能将策略关联至网络工作区下的云电脑；
2.每台云电脑最多只能关联一条电脑策略，如需切换策略需要先将该电脑从原有策略中移除；
3.电脑策略各项兼容情况点击查看","Note for creating a policy:
1. After creating a computer policy, it needs to be delivered to the corresponding network workspace. After the delivery is complete, the policy can be associated with the cloud computer under the network workspace.
Each cloud computer can only be associated with one computer policy at most. To change the policy, remove the computer from the original policy first.
3. Click to view the compatibility of the computer policy",創建策略注意事項：\n1.創建電腦策略後需要下發至對應的網絡工作區，下發完成後才能將策略關聯至網絡工作區下的雲電腦；\n2.每臺雲電腦最多隻能關聯一條電腦策略，如需切換策略需要先將該電腦從原有策略中移除；\n3.電腦策略各項兼容情況點擊查看