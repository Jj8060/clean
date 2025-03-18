# 值日排班日历 

这是一个用于查看和管理值日排班情况的日历应用。

## 功能
 
- 查看每周值日组
- 查看每日值日考勤
- 管理员评价功能
- 管理员登录系统
- 评分系统

## 安装

1. 克隆仓库：

   ```bash
   git clone <your-repo-url>
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 启动应用：

   ```bash
   npm start
   ```

## 管理员账号

- admin1
- admin2

## 功能特点

- 📅 值日排班表显示
- 👥 8个值日组（每组3人）管理
- ✅ 考勤状态记录（已到/迟到/缺席）
- 📊 考核评分系统
- 🔍 详细的统计分析
- 👮‍♂️ 管理员权限控制

## 技术栈

- React 18
- Next.js 14
- TypeScript
- TailwindCSS
- date-fns

## 安装步骤

1. 克隆项目
bash
git clone [项目地址]
cd [项目目录]

2. 安装依赖

bash
npm instal

3. 运行开发服务器

bash
npm run dev

4. 打开浏览器访问 http://localhost:3000

## 项目依赖

```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
```

## 项目结构

```
src/
├── components/          # 组件目录
│   ├── AttendanceModal.tsx    # 考勤评分弹窗
│   ├── LoginModal.tsx         # 登录弹窗
│   └── RecordDetailModal.tsx  # 记录详情弹窗
├── config/             # 配置文件
│   └── admin.ts       # 管理员账号配置
├── data/              # 数据文件
│   └── groups.ts      # 值日组数据
├── pages/             # 页面文件
│   ├── index.tsx      # 首页（排班表）
│   └── statistics.tsx # 统计页面
├── styles/            # 样式文件
│   └── globals.css    # 全局样式
└── types/             # 类型定义
    └── index.ts       # 类型声明文件
```

## 功能说明

1. 值日排班表
   - 显示每周值日组安排
   - 查看每天值日人员
   - 记录考勤状态

2. 考核评分
   - 记录出勤状态
   - 评分系统（1-10分）
   - 惩罚值日天数设置
   - 备注信息

3. 统计分析
   - 按组别筛选
   - 查看平均分
   - 出勤统计
   - 惩罚天数统计
   - 详细记录查看

## 使用的颜色

- 蓝色（主题色）：#2a63b7
- 红色（警告色）：#ff2300
- 绿色（成功色）：#00bd39

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 注意事项

- 数据存储使用 localStorage，刷新页面数据不会丢失
- 需要管理员权限才能进行考勤评分
- 所有用户都可以查看排班和统计信息

## 开发环境要求

- Node.js 18.0.0 或更高版本
- npm 9.0.0 或更高版本

## 部署说明

### 1. Vercel 部署（推荐）

最简单的部署方式，特别适合 Next.js 项目：

1. 在 [Vercel](https://vercel.com) 注册账号
2. 将代码推送到 GitHub 仓库
3. 在 Vercel 中导入该 GitHub 仓库
4. Vercel 会自动部署，并提供一个域名

### 2. 自有服务器部署

1. 构建项目
```bash
npm run build
```

2. 使用 PM2 运行（需要先安装 PM2：`npm install -g pm2`）
```bash
pm2 start npm --name "duty-system" -- start
```

3. 配置 Nginx 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Docker 部署

1. 创建 Dockerfile：
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. 构建并运行 Docker 镜像：
```bash
docker build -t duty-system .
docker run -p 3000:3000 duty-system
```

### 4. 静态导出部署

如果不需要服务端功能，可以导出静态文件：

1. 修改 next.config.js：
```js
module.exports = {
  output: 'export'
}
```

2. 构建静态文件：
```bash
npm run build
```

3. 将 out 目录下的文件部署到任意静态文件托管服务：
- GitHub Pages
- Netlify
- 阿里云 OSS
- 腾讯云 COS

## 注意事项

- 由于使用了 localStorage 存储数据，建议在正式环境使用后端数据库
- 如果使用自有服务器，建议配置 SSL 证书
- 建议配置环境变量管理敏感信息（如管理员密码）
- 建议配置错误监控和日志系统


## 用来调用之前的版本
git checkout ID

## 用来建立一个新的分支
git checkout -b temp-fix

## 转回到main 的branch
git checkout main 

## 强行替换掉main 
git reset --hard temp-fix

## 推送目前版本到main 
git push -f origin main

## Vercel弹窗解决方案

为了彻底解决Vercel环境中出现的"只能重置最近20分钟内的更改"弹窗问题，我们实施了以下全面解决方案：

### 1. 服务端拦截

- 添加了中间件(`middleware.ts`)拦截所有Vercel相关API请求
- 自定义了`vercel.json`配置，禁止Vercel相关资源加载
- 使用`robots.txt`阻止搜索引擎索引Vercel相关路径

### 2. 客户端拦截

- 注册增强版Service Worker(`sw.js`)拦截所有与Vercel相关的网络请求
- 创建专门的`BlockVercelBanner`组件监听并移除DOM中的Vercel弹窗元素
- 重写`window.alert`方法过滤Vercel相关警告弹窗
- 在`_document.tsx`中添加元标签禁用Vercel分析和缓存功能

### 3. 缓存优化

- 配置Service Worker缓存策略，避免加载可能包含弹窗代码的资源
- 清理本地存储中可能触发弹窗的数据
- 优化Next.js构建配置，删除不必要的Vercel相关代码

### 使用说明

此解决方案无需用户任何额外操作，所有拦截功能都会自动运行。如果仍然偶尔看到弹窗，请尝试以下步骤：

1. 强制刷新页面（Windows: Ctrl+F5, Mac: Cmd+Shift+R）
2. 如果问题持续，清除浏览器缓存后再次访问
3. 确保未禁用JavaScript，因为拦截逻辑依赖JavaScript运行

### 开发者注意事项

- 所有拦截代码都有详细注释，便于理解和维护
- 解决方案不会影响应用的正常功能和性能
- 代码设计为可在所有现代浏览器中兼容运行