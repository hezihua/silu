# 思录（siLu）

个人博客 · 记录学习与思考的痕迹。

基于 Next.js 16 + React 19 + MDX 构建，纯 Markdown 写作，零数据库，静态生成。

## 技术栈

| 类别 | 选择 |
| --- | --- |
| 框架 | Next.js 16.1.6（App Router + Turbopack + SSG） |
| UI | React 19 + TypeScript |
| 样式 | Tailwind CSS v4 + `@tailwindcss/typography`（暗色 prose） |
| 内容源 | MDX + gray-matter（frontmatter 解析） |
| Markdown 扩展 | remark-gfm（GFM 表格/任务列表）、remark-math + rehype-katex（数学公式）、rehype-highlight（代码高亮）、rehype-slug（标题锚点） |
| 包管理 | pnpm |
| 部署 | Render（Node + 免费套餐，新加坡节点） |

## 快速开始

```bash
# 环境要求
node >= 18
pnpm >= 9

# 安装依赖
pnpm install

# 开发（端口自动从 3000 自增）
pnpm dev

# 构建
pnpm build

# 生产启动（端口自动从 3000 自增）
pnpm start
```

启动后终端会打印 `http://localhost:XXXX`，按那个地址访问即可。

### 自定义端口范围

```bash
# 从 5173 开始自增，最高 5200
SILU_PORT_START=5173 SILU_PORT_MAX=5200 pnpm dev
```

## 项目结构

```
siLu/
├── content/posts/              # 博客文章（Markdown）
│   ├── 2026-08-16-human-as-system.md
│   └── 2026-08-16-wealth-four-forces.md
├── scripts/
│   └── with-auto-port.mjs      # 自动寻找空闲端口 + 启动 next
├── src/app/
│   ├── components/
│   │   ├── Header.tsx          # 顶部导航
│   │   ├── Sidebar.tsx         # 左侧栏（未启用，保留）
│   │   └── Toc.tsx             # 文章详情页右侧目录锚点
│   ├── lib/
│   │   └── posts.ts            # 文章列表/单篇/上下篇/TOC 解析
│   ├── posts/[slug]/page.tsx   # 文章详情（SSG + 上下篇导航）
│   ├── globals.css             # Tailwind + prose 暗色主题 + 代码/KaTeX 样式
│   ├── layout.tsx              # 全局布局（深色背景）
│   └── page.tsx                # 首页：文章卡片列表 + 空态
├── render.yaml                 # Render 部署蓝图
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── .gitignore
└── .nvmrc
```

## 写文章

在 `content/posts/` 下新建一个 `YYYY-MM-DD-slug.md` 即可。文件名里的日期部分用于排序，`slug` 部分会成为 URL 路径（`/posts/{slug}`）。

```markdown
---
title: 文章标题
description: 一句话摘要，会显示在首页卡片里
date: 2026-08-16
tags: [标签1, 标签2]
---

# 一级标题（正文从这里开始，直接显示在详情页）

支持 **GFM**、`代码`、公式：$E = mc^2$
```

- 详情页不渲染 frontmatter，页面从正文第一个 `# 标题` 开始
- 右侧目录锚点（宽屏 ≥ 1280px）自动提取正文 H1–H3
- 标签数组是任意字符串数组，目前用于展示，无分类页路由

### 内容格式支持

| 功能 | 语法 |
| --- | --- |
| 加粗 / 斜体 / 行内代码 | `**x**` `*x*` `` `x` `` |
| GFM 表格 / 任务列表 / 删除线 | `| x | y |`、`- [ ] todo`、`~~x~~` |
| 引用块 / 无序列表 / 有序列表 | 标准 Markdown |
| 代码块（自动语言高亮） | 三反引号 + 语言名 |
| 行内公式 | `$E = mc^2$` |
| 块级公式 | 独立 `$$ ... $$` |
| 链接 / 图片 | `[文本](url)`、`![alt](url)` |

### 上下篇导航

详情页底部按日期自动生成「上一篇 / 下一篇」。

## 部署（Render）

项目已内置 [render.yaml](./render.yaml)：

1. 在 Render 控制台选择 **Blueprint** 模式，关联本仓库
2. 构建命令：`pnpm install --frozen-lockfile && pnpm build`
3. 启动命令：`pnpm start`
4. Render 免费套餐在新加坡节点（`render.yaml` 已指定）

也可以用 `next build` 产物部署到任何支持 Node 18+ 的托管（Vercel / Netlify / Fly.io / 自有服务器）。

## 写在最后

> 「思录」——思而后有录，录以证思。
