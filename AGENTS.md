# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── page.tsx        # 主对话页面（聊天界面）
│   │   ├── layout.tsx      # 全局布局
│   │   └── globals.css     # 全局样式（夜空主题、毛玻璃效果、动画）
│   ├── components/
│   │   ├── ui/             # Shadcn UI 组件库
│   │   ├── ChatBubble.tsx  # 聊天气泡组件
│   │   ├── TypingIndicator.tsx # 打字指示器（正在倾听...）
│   │   ├── CrisisCard.tsx  # 危机预警卡片
│   │   └── EmotionSummaryCard.tsx # 情绪摘要卡片
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/
│   │   ├── utils.ts        # 通用工具函数 (cn)
│   │   └── emotion-engine.ts # 情绪识别引擎（关键词匹配、治愈策略、危机检测）
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## Anteiku 核心模块

### 情绪识别引擎 (`src/lib/emotion-engine.ts`)
- 基于关键词匹配的情绪分类（焦虑/疲惫/迷茫/孤独/自我否定）
- 强信号直接归类，弱信号需命中2个以上
- 置信度分级：high（2+强信号）、medium（1强+1弱）、low（仅弱信号）
- 危机关键词检测（最高优先级）
- 每种情绪5+组话术变体，随机选取避免公式化
- 预设选项系统：默认选项组 + 情绪相关跟进选项
- 对话记忆系统：跨会话持久化情绪状态，支持新旧用户差异化打招呼
- localStorage 持久化对话历史、情绪记录和用户记忆

### 设计风格 (`DESIGN.md`)
- 夜空渐变背景（#0f0e2a → #1a1640）
- 毛玻璃气泡效果（glass-ai / glass-user）
- 柔和淡入动画（message-appear, fade-in）
- 琥珀金强调色（#c4a060）
- 品牌展示动画（进入时的Logo脉冲效果）
- 打字机效果（AI打招呼时逐字显示）
- 预设选项胶囊按钮（圆角、hover放大）
