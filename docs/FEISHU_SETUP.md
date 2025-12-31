# 飞书应用配置指南

## 1. 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 点击「创建企业自建应用」
3. 填写应用名称：`RhythmTrade`
4. 填写应用描述：`交易计划管理工具`

## 2. 配置应用权限

在「权限管理」中开通以下权限：

### 文档权限
- `docx:document` - 查看、评论和导出新版文档
- `docx:document:create` - 创建新版文档
- `docx:document:update` - 编辑新版文档
- `drive:drive` - 查看、评论、下载云空间中所有文件
- `drive:drive:create` - 上传、创建和移动云空间中的文件

### 用户信息权限
- `contact:user.base:readonly` - 获取用户基本信息

## 3. 配置重定向 URL

在「安全设置」→「重定向 URL」中添加：

**开发环境**：
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

**生产环境**：
```
https://你的域名.vercel.app/auth/callback
```

## 4. 获取凭证

在「凭证与基础信息」中获取：
- `App ID`
- `App Secret`

## 5. 配置环境变量

### 本地开发

创建 `.env.local` 文件：

```bash
VITE_FEISHU_APP_ID=cli_xxxxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Vercel 部署

在 Vercel 项目设置中添加环境变量：

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_FEISHU_APP_ID` | 你的 App ID | All |
| `FEISHU_APP_SECRET` | 你的 App Secret | All |

> ⚠️ 注意：`FEISHU_APP_SECRET` 只在服务端使用，不要暴露给前端

## 6. 发布应用

1. 在「版本管理与发布」中创建版本
2. 申请上线（企业自建应用可直接上线）
3. 应用上线后才能正常使用 OAuth

## OAuth 流程说明

```
1. 用户点击「飞书登录」
   ↓
2. 跳转到飞书授权页面
   https://open.feishu.cn/open-apis/authen/v1/authorize?...
   ↓
3. 用户授权后，飞书回调到
   /auth/callback?code=xxx
   ↓
4. 前端将 code 发送到 Serverless Function
   /api/auth/token
   ↓
5. Serverless Function 用 code + app_secret 换取 access_token
   ↓
6. 前端存储 token，完成登录
```
