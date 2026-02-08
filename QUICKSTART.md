# 快速开始指南

5 分钟快速上手极简博客系统。

## 准备工作

1. **安装 Node.js**
   - 访问 https://nodejs.org
   - 下载并安装 LTS 版本（推荐 18.x 或更高）

2. **安装 Git**
   - 访问 https://git-scm.com
   - 下载并安装

3. **注册账号**
   - GitHub 账号：https://github.com
   - Cloudflare 账号：https://dash.cloudflare.com

## 第一步：克隆项目

```bash
# 下载项目代码
git clone https://github.com/yourusername/minimal-blog.git
cd minimal-blog
```

## 第二步：安装依赖

```bash
# 进入前端目录
cd frontend

# 安装依赖包
npm install
```

## 第三步：配置环境变量

创建 `frontend/.env` 文件：

```env
VITE_GITHUB_REPO=yourusername/minimal-blog
VITE_CLOUDFLARE_WORKER_URL=https://your-worker.workers.dev
```

**注意：** 暂时可以用临时值，等部署 Worker 后再更新。

## 第四步：本地运行

```bash
# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看效果。

## 第五步：部署 Cloudflare Worker

### 5.1 创建 Worker

1. 登录 Cloudflare Dashboard
2. 点击 "Workers & Pages"
3. 点击 "Create application"
4. 选择 "Create Worker"
5. 命名为 `minimal-blog-api`

### 5.2 部署代码

1. 复制 `cloudflare-worker/worker.js` 的全部内容
2. 粘贴到 Worker 编辑器
3. 点击 "Save and Deploy"

### 5.3 配置变量

在 Worker 设置页面，添加环境变量：

```
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_REPO=yourusername/minimal-blog
AUTH_SECRET=your-random-secret-key
ALLOWED_EMAILS=your@email.com
```

**获取 GitHub Token：**
1. GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. 勾选 `repo` 权限
4. 生成并复制 token

**生成 AUTH_SECRET：**
```bash
# Mac/Linux
openssl rand -hex 32

# 或使用在线工具
https://generate-secret.vercel.app/32
```

### 5.4 更新前端配置

将 Worker URL 更新到 `frontend/.env`：

```env
VITE_CLOUDFLARE_WORKER_URL=https://minimal-blog-api.yourname.workers.dev
```

重启开发服务器：

```bash
npm run dev
```

## 第六步：准备 GitHub 仓库

在你的 GitHub 仓库中创建目录结构：

```
minimal-blog/
├── posts/
│   ├── diary/
│   ├── tech/
│   └── life/
└── images/
```

在每个空目录中创建 `.gitkeep` 文件并提交：

```bash
# 在仓库根目录执行
mkdir -p posts/diary posts/tech posts/life images
touch posts/diary/.gitkeep
touch posts/tech/.gitkeep
touch posts/life/.gitkeep
touch images/.gitkeep

git add .
git commit -m "Initialize directory structure"
git push
```

## 第七步：测试功能

### 7.1 验证连接

打开浏览器控制台，执行：

```javascript
// 测试 Worker 连接
fetch('https://your-worker.workers.dev/posts')
  .then(r => r.json())
  .then(console.log);
```

如果返回 `{posts: []}` 说明连接正常。

### 7.2 临时登录（开发用）

在控制台执行：

```javascript
// 生成测试 token
const payload = { email: 'your@email.com', exp: Date.now() + 86400000 };
const token = btoa(JSON.stringify(payload)) + '.fake';
localStorage.setItem('auth_token', token);
location.reload();
```

**注意：** 这只是临时方案，生产环境需要实现正式登录。

### 7.3 发布测试文章

1. 刷新页面后，应该能看到快速输入框
2. 输入标题和内容
3. 选择分类
4. 点击发布
5. 等待几秒，文章应该出现在列表中

## 第八步：部署到 GitHub Pages

### 8.1 配置 vite.config.js

编辑 `frontend/vite.config.js`，设置正确的 base：

```javascript
export default defineConfig({
  base: '/minimal-blog/', // 改为你的仓库名
  // ...
})
```

### 8.2 执行部署

```bash
# 构建并部署
npm run deploy
```

### 8.3 配置 GitHub Pages

1. 访问仓库 Settings → Pages
2. Source 选择 `gh-pages` 分支
3. 点击 Save
4. 等待部署完成（约 1-2 分钟）
5. 访问 `https://yourusername.github.io/minimal-blog/`

## 常见问题

### Q: Worker 返回 401 错误？

检查：
- `GITHUB_TOKEN` 是否正确
- Token 权限是否包含 `repo`
- Token 是否已过期

### Q: 文章列表为空？

检查：
- GitHub 仓库是否有正确的目录结构
- 是否在 `posts` 目录下有 `.md` 文件
- Worker 的 `GITHUB_REPO` 变量是否正确

### Q: 快速输入框不可用？

检查：
- 是否已登录（查看 localStorage 中的 `auth_token`）
- Cloudflare Worker 是否部署成功
- 浏览器控制台是否有错误信息

### Q: 部署后样式错误？

检查：
- `vite.config.js` 中的 `base` 路径是否正确
- GitHub Pages 是否已启用
- 浏览器缓存是否已清除

## 下一步

- 📖 阅读 [完整部署指南](./DEPLOYMENT.md)
- 🎨 自定义主题颜色
- ✍️ 开始写作！

## 获取帮助

遇到问题？

1. 查看浏览器控制台的错误信息
2. 查看 Worker 日志
3. 检查 GitHub Actions 构建日志
4. 提交 Issue

祝使用愉快！
