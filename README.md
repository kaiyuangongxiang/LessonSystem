# 在线教师备课系统

在线教师备课系统是一个前后端分离的教学管理项目，覆盖门户展示、课程资源、教师备课、课件管理、教学素材、教学交流和后台管理等场景。

项目分为 `frontend` 和 `backend` 两部分：

- `frontend`：基于 Vue 3 + Vite 的前端应用。
- `backend`：基于 Node.js + Express + MySQL 的后端 API 服务。
- `backend/sql`：当前包含一份 MySQL 表结构快照脚本。

## 功能概览

- 门户首页：展示系统介绍、公告、课程和公开素材。
- 课程中心：查看课程列表、课程详情、课程资料、课程视频和备课附件。
- 用户认证：支持登录、注册和角色识别。
- 教师端：管理素材库、备课单、课件、资料、视频、个人资料和教学交流。
- 学生端：参与教学交流主题与回复。
- 管理端：管理系统信息、公告、账号、教师、学生、学院、课程、备课单、素材和交流内容。
- 文件上传：支持资料、视频、封面图、素材文件和备课附件上传。

## 技术栈

### 前端

- Vue 3
- Vue Router
- Pinia
- Element Plus
- Vite
- TypeScript
- SCSS
- Axios

### 后端

- Node.js
- Express
- MySQL 8
- mysql2
- JWT
- bcryptjs
- multer
- dotenv
- nodemon

## 目录结构

```text
LessonSystem/
|-- backend/
|   |-- sql/
|   |   `-- lesson_prep_system_2026-04-25_213940.sql
|   |-- src/
|   |   |-- config/          # 环境变量和数据库连接
|   |   |-- controllers/     # 请求控制器
|   |   |-- middleware/      # 鉴权、上传、日志、错误处理
|   |   |-- routes/          # API 路由
|   |   |-- services/        # 业务逻辑
|   |   |-- utils/           # 工具函数
|   |   |-- app.js           # Express 应用实例
|   |   `-- server.js        # 服务启动入口
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- components/      # 公共组件
|   |   |-- layouts/         # 页面布局
|   |   |-- router/          # 前端路由
|   |   |-- services/        # API 调用封装
|   |   |-- stores/          # Pinia 状态
|   |   |-- styles/          # 全局样式
|   |   |-- utils/           # 工具函数
|   |   `-- views/           # 页面视图
|   |-- .env.example
|   `-- package.json
|-- .editorconfig
|-- .gitattributes
`-- README.md
```

## 环境要求

- Node.js 18 或更高版本
- npm
- MySQL 8.x

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. 配置后端环境变量

复制 `backend/.env.example` 为 `backend/.env`：

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

字段说明：

- `PORT`：后端服务端口，默认 `3000`。
- `JWT_SECRET`：JWT 签名密钥，生产环境必须替换为强随机字符串。
- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`：MySQL 连接配置。
- `FRONTEND_ORIGIN`：允许跨域访问后端的前端地址。
- `RESOURCE_ROOT`：资源文件访问根地址，可为空；为空时由服务端按当前请求生成资源链接。

### 3. 配置前端环境变量

复制 `frontend/.env.example` 为 `frontend/.env`：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 数据库初始化

当前 `backend/sql` 目录下包含一份完整表结构快照：

```text
backend/sql/lesson_prep_system_2026-04-25_213940.sql
```

该脚本来自 MySQL 8.0.34 导出，目标库名为 `lesson_prep_system`。脚本包含 `DROP TABLE IF EXISTS` 和 `CREATE TABLE`，但不包含 `CREATE DATABASE`、`USE` 和业务数据插入语句。

### 1. 创建数据库

```sql
CREATE DATABASE lesson_prep_system
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

如果你的 MySQL 版本不支持 `utf8mb4_0900_ai_ci`，可以改用：

```sql
CREATE DATABASE lesson_prep_system
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2. 导入表结构

在项目根目录执行：

```bash
mysql -h 127.0.0.1 -P 3307 -u root -p lesson_prep_system < backend/sql/lesson_prep_system_2026-04-25_213940.sql
```

如果你的数据库端口是默认 `3306`，请把 `-P 3307` 改成 `-P 3306`，并同步修改 `backend/.env` 中的 `DB_PORT`。

### 3. 数据表清单

SQL 快照包含以下表：

- `admin`：管理员账号
- `asset_library`：教学素材库
- `college`：学院
- `course_intro`：课程
- `course_video`：课程视频
- `courseware`：课件
- `material`：备课资料
- `message`：留言
- `message_reply`：留言回复
- `message_topic`：教学交流主题
- `message_topic_reply`：教学交流回复
- `notice`：公告
- `student_user`：学生账号
- `system_profile`：系统介绍
- `teacher_user`：教师账号
- `teaching_prep`：教师备课单
- `teaching_prep_attachment`：备课附件

### 4. 初始账号说明

当前 SQL 文件是表结构快照，没有 `INSERT INTO` 初始化数据。导入后如果没有账号数据，需要自行写入管理员、教师或学生账号，或通过已有注册/后台管理流程创建账号。

后端密码使用 `bcryptjs` 校验，直接手写账号时密码字段需要写入 bcrypt 哈希值，不能写明文密码。

## 启动项目

### 启动后端

```bash
cd backend
npm run dev
```

后端默认地址：

```text
http://localhost:3000
```

健康检查接口：

```text
GET http://localhost:3000/api/health
```

### 启动前端

```bash
cd frontend
npm run dev
```

前端默认地址：

```text
http://localhost:5173
```

## 远程服务器连接

当前服务器系统为 Ubuntu 24.04，可通过 SSH 连接：

```bash
ssh root@47.106.167.233
```

## 常用脚本

### 后端

```bash
npm run dev
npm start
```

- `npm run dev`：使用 `nodemon` 启动开发服务。
- `npm start`：使用 `node` 启动服务。

### 前端

```bash
npm run dev
npm run build
npm run preview
```

- `npm run dev`：启动 Vite 开发服务。
- `npm run build`：执行类型检查并构建生产包。
- `npm run preview`：本地预览生产构建。

## 主要页面

### 门户页面

- `/`：门户首页
- `/assets`：公开素材
- `/courses`：课程列表
- `/courses/:courseId`：课程详情

### 认证页面

- `/login`：登录
- `/register`：注册

### 教师端

- `/teacher`：教师首页
- `/teacher/assets`：素材库
- `/teacher/preps`：备课单管理
- `/teacher/coursewares`：课件工具
- `/teacher/profile`：个人信息
- `/teacher/messages`：教学交流

### 学生端

- `/student`：学生首页
- `/student/messages`：教学交流

### 管理端

- `/admin`：管理首页
- `/admin/system`：系统管理
- `/admin/accounts`：管理员账号
- `/admin/teachers`：教师用户
- `/admin/students`：学生用户
- `/admin/colleges`：学院管理
- `/admin/courses`：课程管理
- `/admin/preps`：备课单管理
- `/admin/assets`：素材管理
- `/admin/messages`：教学交流管理

## API 概览

后端接口统一挂载在 `/api` 下：

- `/api/health`：健康检查
- `/api/auth`：注册、登录、注册选项
- `/api/portal`：门户、课程、公开素材、资源下载和视频播放
- `/api/teacher`：教师工作台、备课、课件、素材、资源、个人信息和交流
- `/api/student`：学生交流
- `/api/admin`：后台管理

`/api/teacher`、`/api/student` 和 `/api/admin` 均需要登录后携带 JWT，并且需要匹配对应角色。

## 文件上传目录

后端通过 `multer` 处理上传文件，默认保存在 `backend/uploads` 下：

```text
backend/uploads/materials
backend/uploads/videos
backend/uploads/video-covers
backend/uploads/assets/images
backend/uploads/assets/audios
backend/uploads/assets/videos
backend/uploads/assets/files
backend/uploads/preps/attachments
```

部署时请确保运行后端服务的用户对上传目录有读写权限。上传文件通常不建议提交到 Git。

## 编码说明

项目统一使用 UTF-8：

- `.editorconfig` 设置 `charset = utf-8`。
- `.gitattributes` 对常见源码文件设置 `working-tree-encoding=UTF-8`。
- 后端 MySQL 连接使用 `utf8mb4`。
- SQL 快照中包含 `SET NAMES utf8mb4`，表默认字符集也是 `utf8mb4`。

如果在 Windows PowerShell 中看到中文乱码，先用编辑器确认文件编码是否为 UTF-8。终端输出乱码不一定代表文件内容损坏。

## 开发约定

- 后端新增接口建议按 `routes -> controllers -> services` 的结构扩展。
- 前端接口调用统一放在 `frontend/src/services`。
- 前端页面路由集中在 `frontend/src/router/index.ts`。
- 角色权限由后端 `authenticate` 和 `requireRole` 中间件控制，前端路由守卫只做辅助限制。
- 新增上传功能时，前端字段名需要和后端 `multer` 配置保持一致。
- 新增中文文案或 SQL 注释时，注意保持 UTF-8 编码。

## 部署建议

1. 前端执行 `npm run build`，生成 `frontend/dist`。
2. 后端配置生产环境 `.env`，重点检查 `JWT_SECRET`、数据库配置和 `FRONTEND_ORIGIN`。
3. 配置反向代理，将前端静态资源和后端 `/api` 指向对应服务。
4. 持久化 `backend/uploads`，避免部署后用户上传文件丢失。
5. 生产环境建议使用 PM2、systemd、Docker 或其他进程管理方案运行后端服务。
