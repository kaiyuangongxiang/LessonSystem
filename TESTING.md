# LessonSystem 测试方案

本文档用于指导对 `LessonSystem` 整个系统进行联调、回归和验收测试。

当前项目是前后端分离架构：

- `frontend`：Vue 3 + Vite
- `backend`：Node.js + Express + MySQL

目前仓库中没有现成的自动化测试脚本，也没有 `test` 命令，因此现阶段最适合采用“环境检查 + 接口联调 + 角色业务回归 + 构建验证”的整体测试方式。

## 1. 测试目标

对整个系统进行测试时，重点验证以下内容：

- 前后端服务是否能够正常启动
- 数据库是否初始化正确
- 门户端、教师端、学生端、管理端是否可正常使用
- 登录、鉴权、角色权限控制是否正确
- 文件上传、下载、预览、播放是否正常
- 关键业务流程是否能够闭环
- 异常输入、空数据、无权限访问时系统是否能正确处理

## 2. 测试前准备

### 2.1 环境要求

- Node.js 18 或更高版本
- npm
- MySQL 8.x

### 2.2 安装依赖

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2.3 配置环境变量

后端 `.env`：

```env
PORT=3000
JWT_SECRET=replace-with-a-strong-secret
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=123456
DB_NAME=lesson_prep_system
FRONTEND_ORIGIN=http://localhost:5173
RESOURCE_ROOT=
```

前端 `.env`：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2.4 初始化数据库

1. 创建数据库：

```sql
CREATE DATABASE lesson_prep_system
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

2. 导入 SQL 结构：

```bash
mysql -h 127.0.0.1 -P 3307 -u root -p lesson_prep_system < backend/sql/lesson_prep_system_2026-04-25_213940.sql
```

### 2.5 启动系统

启动后端：

```bash
cd backend
npm run dev
```

启动前端：

```bash
cd frontend
npm run dev
```

### 2.6 基础可用性检查

后端健康检查：

- `GET http://localhost:3000/api/health`

前端访问地址：

- `http://localhost:5173`

### 2.7 准备测试数据

当前 SQL 主要提供表结构，默认没有完整业务数据，因此正式测试前建议准备以下基础数据：

- 1 条学院数据 `college`
- 1 个管理员账号 `admin`
- 1 个教师账号
- 1 个学生账号
- 1 门课程
- 若干素材、资料、视频

说明：

- 教师、学生可以通过注册功能创建，但前提是数据库中已存在学院数据。
- 管理员账号通常需要手动插入数据库。

## 3. 推荐测试工具

- 浏览器：执行前端功能测试
- 浏览器开发者工具：查看请求、响应、报错
- Postman 或 Apifox：执行接口测试
- MySQL 客户端：检查数据库写入结果

## 4. 推荐测试执行顺序

建议按以下顺序执行，效率更高，也更容易定位问题：

1. 冒烟测试
2. 门户端测试
3. 认证与登录测试
4. 教师端测试
5. 学生端测试
6. 管理端测试
7. 权限测试
8. 文件处理测试
9. 构建与部署前验证

## 5. 冒烟测试

目标：确认系统最基础功能可用。

检查项：

- 后端服务能正常启动
- 前端服务能正常启动
- `GET /api/health` 返回 200
- 首页可访问
- 登录页、注册页可访问
- 前端可正常请求后端接口
- 前端构建成功

前端构建验证命令：

```bash
cd frontend
npm run build
```

## 6. 门户端测试

测试对象：未登录用户可访问的公共模块。

建议检查：

- 首页内容是否正常加载
- 课程列表是否能正常显示
- 课程列表筛选、分页、排序是否正常
- 课程详情页是否能打开
- 课程资料是否可查看或下载
- 课程视频是否可播放
- 公共素材是否可查看
- 素材预览、素材下载是否正常
- 空数据时页面是否能正常显示而不报错

重点接口：

- `/api/portal/home`
- `/api/portal/courses`
- `/api/portal/courses/:courseId`
- `/api/portal/courses/:courseId/assets`
- `/api/portal/assets`
- `/api/portal/assets/:assetId/file`
- `/api/portal/assets/:assetId/download`
- `/api/portal/materials/:materialId/download`
- `/api/portal/videos/:videoId/play`

## 7. 认证与登录测试

目标：验证注册、登录、角色跳转和登录态控制。

建议检查：

- 教师注册成功
- 学生注册成功
- 注册时缺少字段是否提示正确
- 注册时学院不存在是否提示正确
- 教师登录成功后是否进入教师端
- 学生登录成功后是否进入学生端
- 管理员登录成功后是否进入管理端
- 错误密码是否登录失败
- 错误角色是否登录失败
- token 失效后是否跳回登录页
- 未登录访问受保护页面是否跳转到登录页

重点接口：

- `/api/auth/register-options`
- `/api/auth/register`
- `/api/auth/login`

## 8. 教师端测试

教师端接口和业务最多，建议按业务链测试。

### 8.1 工作台

- 仪表盘数据是否正常加载

### 8.2 备课单

- 新建备课单
- 编辑备课单
- 删除备课单
- 发布备课单
- 上传备课附件
- 挂载已有素材为附件
- 删除附件
- 预览或下载附件

### 8.3 课件

- 新建课件
- 查看课件详情
- 编辑课件
- 删除课件
- 发布课件

### 8.4 素材库

- 上传文件类素材
- 新建文本素材
- 编辑素材
- 删除素材
- 设置素材公开或私有
- 下载素材

### 8.5 教学资源

- 上传资料
- 上传视频
- 上传视频封面
- 查看资源列表
- 查看资源详情
- 编辑资源
- 删除资源

### 8.6 个人资料

- 查看个人资料
- 修改个人资料

### 8.7 教学交流

- 发布主题
- 查看主题详情
- 回复主题
- 删除主题
- 删除回复

重点接口范围：

- `/api/teacher/dashboard`
- `/api/teacher/courses/options`
- `/api/teacher/preps`
- `/api/teacher/coursewares`
- `/api/teacher/assets`
- `/api/teacher/resources`
- `/api/teacher/materials`
- `/api/teacher/videos`
- `/api/teacher/profile`
- `/api/teacher/messages`

## 9. 学生端测试

学生端当前主要聚焦教学交流模块。

建议检查：

- 登录后是否进入学生首页
- 主题列表是否正常
- 发帖是否成功
- 回复是否成功
- 删除自己的主题是否成功
- 删除自己的回复是否成功
- 学生是否无法访问教师端和管理端功能

重点接口：

- `/api/student/messages`

## 10. 管理端测试

目标：验证后台管理能力是否可形成闭环。

建议检查：

- 仪表盘加载是否正常
- 系统简介是否可维护
- 公告是否可新增、编辑、删除
- 管理员账号是否可管理
- 教师账号是否可管理
- 学生账号是否可管理
- 学院是否可新增、编辑、删除
- 课程是否可新增、编辑、删除
- 备课单是否可管理
- 素材是否可管理
- 资料是否可管理
- 视频是否可管理
- 交流内容是否可管理

重点接口范围：

- `/api/admin/dashboard`
- `/api/admin/system`
- `/api/admin/admins`
- `/api/admin/teachers`
- `/api/admin/students`
- `/api/admin/colleges`
- `/api/admin/courses`
- `/api/admin/preps`
- `/api/admin/assets`
- `/api/admin/materials`
- `/api/admin/videos`
- `/api/admin/messages`

## 11. 权限测试

该系统按 `teacher`、`student`、`admin` 三类角色做了权限控制，权限测试必须单独执行。

建议重点测试：

- 不带 token 访问教师接口，应返回未登录
- 不带 token 访问学生接口，应返回未登录
- 不带 token 访问管理员接口，应返回未登录
- 教师 token 访问管理员接口，应被拒绝
- 学生 token 访问教师接口，应被拒绝
- 学生 token 访问管理员接口，应被拒绝
- 教师 token 访问学生接口，应被拒绝
- 登录后 token 失效时，应提示重新登录

## 12. 文件相关测试

由于系统涉及较多上传、下载、预览和播放功能，这部分需要重点验证。

建议检查：

- 上传资料文件是否成功
- 上传视频文件和封面是否成功
- 上传素材文件是否成功
- 上传后的数据库路径是否正确
- 文件是否真实保存到 `backend/uploads` 对应目录
- 文件下载是否正常
- 图片或文本预览是否正常
- 视频播放是否正常
- 删除记录后前端是否同步不可见
- 文件丢失时接口是否返回合理错误

建议重点检查目录：

- `backend/uploads/materials`
- `backend/uploads/videos`
- `backend/uploads/video-covers`
- `backend/uploads/assets/images`
- `backend/uploads/assets/audios`
- `backend/uploads/assets/videos`
- `backend/uploads/assets/files`
- `backend/uploads/preps/attachments`

## 13. 异常场景测试

除正常流程外，还应覆盖以下异常情况：

- 必填字段为空
- 参数格式错误
- ID 不存在
- 上传非法文件
- 上传超大文件
- 重复用户名注册
- 用户名或密码错误登录
- 数据为空时页面显示是否正常
- 数据被删除后旧链接是否正确报错

## 14. 构建与上线前验证

在准备部署前，建议至少完成以下检查：

1. 前端执行 `npm run build` 成功
2. 后端在生产环境变量下可以正常启动
3. 前后端连接地址配置正确
4. 数据库连接正确
5. 上传目录存在且具备读写权限
6. 至少完成一次完整角色回归测试

## 15. 建议的测试记录模板

建议把测试结果按表格记录，便于验收和复测。

| 用例编号 | 模块 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 是否通过 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | 登录 | 已存在教师账号 | 输入正确教师账号密码登录 | 登录成功并跳转教师首页 |  |  |  |
| AUTH-002 | 登录 | 已存在教师账号 | 输入错误密码登录 | 提示账号或密码错误 |  |  |  |
| TEACHER-PREP-001 | 备课单 | 教师已登录 | 新建备课单并保存 | 创建成功并显示在列表中 |  |  |  |
| ADMIN-COURSE-001 | 课程管理 | 管理员已登录 | 新增课程 | 新增成功 |  |  |  |
| PERM-001 | 权限 | 无 token | 访问教师接口 | 返回未登录错误 |  |  |  |

## 16. 推荐的最小完整测试流程

如果时间有限，建议至少完成下面这组“最小完整测试”：

1. 启动前后端和数据库
2. 测试 `GET /api/health`
3. 准备管理员、教师、学生、学院、课程基础数据
4. 测试教师注册或登录
5. 测试学生注册或登录
6. 测试管理员登录
7. 教师上传一份资料、一个视频、一个素材
8. 教师创建一个备课单并发布
9. 门户端检查课程详情、资料下载、视频播放是否正常
10. 学生发布一个交流主题并回复
11. 管理员检查后台各管理页面是否能正常查看和操作
12. 执行一次前端构建 `npm run build`

## 17. 后续优化建议

当前项目建议后续逐步补齐自动化测试：

- 后端接口测试：`Jest` 或 `Vitest` + `supertest`
- 前端单元测试：`Vitest` + `Vue Test Utils`
- 端到端测试：`Playwright`

建议优先补自动化的模块：

- 登录与权限
- 教师端核心增删改查
- 管理端核心管理流程
- 门户课程详情与资源访问

