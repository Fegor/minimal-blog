# 部署指南

本文档详细说明如何将博客系统部署到生产环境。

## 第一步：准备 GitHub 仓库

### 1.1 创建仓库

在 GitHub 上创建一个新仓库，例如 `minimal-blog`。

### 1.2 初始化仓库结构

在本地克隆仓库后，创建以下目录结构：

```
minimal-blog/
├── posts/
│   ├── diary/
│   ├── tech/
│   └── life/
└── images/
```

每个目录下创建一个 `.gitkeep` 文件以确保空目录被 Git 追踪。

### 1.3 创建 Personal Access Token

1. 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 设置权限：
   - `repo` (完整权限) ✓
   - `workflow` (如果使用 GitHub Actions) ✓
4. 生成并保存 token（只显示一次）

## 第二步：配置 Cloudflare Workers

### 2.1 创建 Worker

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 点击 "Create application" → "Create Worker"
4. 给 Worker 命名，例如 `minimal-blog-api`

### 2.2 部署 Worker 代码

1. 复制 `cloudflare-worker/worker.js` 的内容
2. 在 Worker 编辑器中粘贴代码
3. 点击 "Save and Deploy"

### 2.3 配置环境变量

在 Worker 设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_xxxxxxxxxxxx` |
| `GITHUB_REPO` | 仓库名称 | `yourusername/minimal-blog` |
| `AUTH_SECRET` | JWT 签名密钥（随机字符串） | `your-secret-key-here` |
| `ALLOWED_EMAILS` | 允许登录的邮箱（逗号分隔） | `your@email.com,admin@example.com` |

**重要提示：** `AUTH_SECRET` 应该是一个长随机字符串，可以用以下命令生成：

```bash
openssl rand -hex 32
```

### 2.4 获取 Worker URL

部署成功后，您会得到一个 Worker URL，格式类似：
```
https://minimal-blog-api.yourname.workers.dev
```

记录这个 URL，后面配置前端时需要用到。

## 第三步：配置前端应用

### 3.1 配置环境变量

在 `frontend` 目录下创建 `.env` 文件：

```env
VITE_GITHUB_REPO=yourusername/minimal-blog
VITE_CLOUDFLARE_WORKER_URL=https://minimal-blog-api.yourname.workers.dev
```

### 3.2 安装依赖

```bash
cd frontend
npm install
```

### 3.3 本地测试

```bash
npm run dev
```

访问 `http://localhost:3000` 测试功能是否正常。

### 3.4 构建生产版本

```bash
npm run build
```

这会在 `dist` 目录生成生产版本文件。

## 第四步：部署到 GitHub Pages

### 方法一：使用 gh-pages 包（推荐）

1. 确保已安装 `gh-pages` 包（已在 package.json 中配置）

2. 在 `vite.config.js` 中设置正确的 base 路径：

```javascript
export default defineConfig({
  base: '/minimal-blog/', // 改为你的仓库名
  // ... 其他配置
})
```

3. 执行部署命令：

```bash
npm run deploy
```

这会自动构建并推送到 `gh-pages` 分支。

### 方法二：手动部署

1. 构建项目：

```bash
npm run build
```

2. 进入 dist 目录：

```bash
cd dist
```

3. 初始化 Git 仓库并推送：

```bash
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:yourusername/minimal-blog.git master:gh-pages
```

### 4.2 启用 GitHub Pages

1. 访问仓库的 Settings → Pages
2. Source 选择 `gh-pages` 分支
3. 点击 Save
4. 等待几分钟，访问 `https://yourusername.github.io/minimal-blog/`

## 第五步：配置自定义域名（可选）

### 5.1 在 GitHub Pages 设置中添加自定义域名

1. 在 Settings → Pages 中的 "Custom domain" 输入您的域名
2. 勾选 "Enforce HTTPS"

### 5.2 配置 DNS

在您的域名 DNS 设置中添加 CNAME 记录：

```
CNAME blog.yourdomain.com → yourusername.github.io
```

### 5.3 更新 Worker CORS 设置

如果使用自定义域名，需要在 Worker 中更新 CORS 配置：

```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://blog.yourdomain.com',
  // ... 其他配置
};
```

## 第六步：首次使用

### 6.1 登录

1. 访问部署好的博客网站
2. 如果看到快速输入框但点击无反应，说明未登录
3. 目前登录功能需要在代码中实现 UI（可以参考后续版本）
4. 临时方案：在浏览器控制台执行：

```javascript
// 临时登录（开发用）
localStorage.setItem('auth_token', 'your-token-here');
location.reload();
```

**注意：** 生产环境应该实现正式的登录界面。

### 6.2 发布第一篇文章

1. 登录成功后，页面顶部会出现快速输入框
2. 点击输入框展开
3. 输入标题和内容
4. 选择分类
5. 点击发布

### 6.3 管理文章

- 点击文章可以展开/收起
- 展开后可以看到完整的 Markdown 渲染效果
- 已登录用户可以看到编辑和删除按钮

## 故障排查

### 问题：Worker 返回 401 错误

- 检查 `GITHUB_TOKEN` 是否正确配置
- 检查 Token 是否有足够的权限
- 检查 Token 是否已过期

### 问题：文章列表为空

- 检查 GitHub 仓库中是否有 `posts/diary`、`posts/tech`、`posts/life` 目录
- 检查目录中是否有 `.md` 文件
- 查看浏览器控制台是否有错误信息

### 问题：无法上传图片

- 检查 Worker 的 `GITHUB_TOKEN` 权限
- 确保仓库中有 `images` 目录
- 检查图片大小是否超过限制（建议 < 1MB）

### 问题：样式显示异常

- 清除浏览器缓存
- 检查 `vite.config.js` 中的 `base` 路径是否正确
- 重新构建并部署

## 更新维护

### 更新前端代码

1. 修改代码后执行：

```bash
npm run build
npm run deploy
```

### 更新 Worker 代码

1. 在 Cloudflare Dashboard 中编辑 Worker
2. 粘贴新代码
3. 点击 "Save and Deploy"

### 备份数据

所有文章都保存在 GitHub 仓库中，定期检查仓库状态即可。建议：

- 启用仓库的 Branch protection
- 定期导出仓库数据
- 考虑设置自动备份

## 安全建议

1. **不要在前端代码中硬编码任何敏感信息**
2. **定期更新 GitHub Token**
3. **限制允许登录的邮箱列表**
4. **使用强随机字符串作为 `AUTH_SECRET`**
5. **启用 HTTPS（GitHub Pages 默认启用）**
6. **考虑添加更严格的 CORS 策略**

## 下一步优化建议

1. 实现完整的登录界面
2. 添加文章搜索功能
3. 添加标签系统
4. 实现评论功能（可使用 Utterances）
5. 添加文章草稿功能
6. 实现图片压缩和优化
7. 添加统计分析（可使用 Google Analytics）

## 获取帮助

如遇到问题，可以：

1. 查看浏览器控制台的错误信息
2. 查看 Cloudflare Worker 的日志
3. 检查 GitHub Actions 的构建日志
4. 参考项目 README 中的示例配置
