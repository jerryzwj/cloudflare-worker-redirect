# Cloudflare Worker 网址重定向工具

一个轻量级的 Cloudflare Worker 工具，支持动态配置多组网址重定向规则，规则持久化存储在 Cloudflare KV 中。

## 功能特点
✅ 支持多组网址重定向（A→A1、B→B1）  
✅ POST 接口动态添加/修改重定向规则  
✅ 兼容 URL 末尾带/或不带/的访问场景  
✅ 内置调试日志，方便排查问题  
✅ 永久（301）/临时（302）重定向可选  

## 前置准备
1. 拥有 Cloudflare 账号（免费版即可）
2. 域名托管在 Cloudflare（或使用 Cloudflare Workers 子域名）

## 快速部署
### 步骤 1：创建 KV 命名空间
1. 登录 Cloudflare 后台 → Workers & Pages → KV → 创建命名空间
2. 命名建议：`REDIRECT_KV`（需和代码中绑定名称一致）

### 步骤 2：部署 Worker
1. Cloudflare 后台 → Workers & Pages → 创建 Worker
2. 清空默认代码，粘贴 `worker.js` 中的代码
3. 保存并部署

### 步骤 3：绑定 KV 命名空间
1. Worker 详情页 → 设置 → KV 命名空间绑定 → 添加绑定
2. 变量名称：`REDIRECT_KV`（必须和代码一致）
3. 选择步骤 1 创建的 KV 命名空间 → 保存

### 步骤 4：绑定自定义域名（可选）
1. Worker 详情页 → 触发器 → 添加路由
2. 路由填写：`你的域名/*`（如 `dav1970.qzz.io/*`）
3. 环境选择：`production` → 保存

## 使用方法
### 1. 添加重定向规则（POST 接口）
#### 接口信息
- 地址：`https://你的Worker域名/set-redirect`
- 方法：POST
- 请求头：`Content-Type: application/json`
- 请求体：
  ```json
  {
    "source": "https://源网址",
    "target": "https://目标网址"
  }
