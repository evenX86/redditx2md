# redditx2md

[![Node Version](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Type](https://img.shields.io/badge/ESM-Module-yellow)](https://nodejs.org/api/esm.html)

> Reddit 内容抓取、AI 翻译与 Markdown 转换工具

`redditx2md` 是一个轻量级的命令行工具，用于从指定 Subreddit 抓取热门帖子，通过 DeepSeek AI 进行翻译和总结，并生成格式化的 Markdown 文件。遵循极简主义设计原则，提供高效、可靠的内容转换服务。

---

## 核心特性

- **智能内容抓取**：从 Reddit API 获取指定 Subreddit 的热门帖子
- **AI 驱动翻译**：集成 DeepSeek API，自动将英文内容翻译为中文
- **智能总结**：使用 AI 对长文进行简洁的中文摘要（2-3 句话）
- **Markdown 生成**：生成格式规范的 Markdown 文件，包含元数据、链接和分类内容
- **内容清洗**：自动处理 HTML 转义字符，压缩多余空行，标准化空白字符
- **错误处理**：完善的异常捕获机制，透明展示网络错误和 API 限制
- **批量处理**：支持并行批处理，优化 API 调用效率
- **Docker 支持**：提供完整的容器化部署方案
- **TDD 开发**：基于测试驱动的开发流程，保证代码质量

---

## 安装指南

### 环境要求

- **Node.js** >= 20.x (LTS)
- **npm** (随 Node.js 安装)
- **DeepSeek API Key**（从 [DeepSeek Platform](https://platform.deepseek.com/) 获取）

### 本地安装

```bash
# 克隆仓库
git clone https://github.com/your-username/redditx2md.git
cd redditx2md

# 安装依赖
npm install

# 或使用 Makefile（推荐）
make install
```

### 环境配置

创建 `.env` 文件（可从 `.env.example` 复制）：

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加你的 DeepSeek API Key：

```env
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

---

## 使用方法

### 基本用法

```bash
# 使用 npm 脚本运行
npm start

# 或使用 Node.js 直接运行
node index.js

# 或使用 Makefile
make run
```

### 开发模式

```bash
# 使用 nodemon 进行热重载开发
npm run dev

# 或使用 Makefile
make dev
```

### 配置说明

程序使用以下默认配置（可在 `lib/constants.js` 中修改）：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `DEFAULT_SUBREDDIT` | `ObsidianMD` | 目标 Subreddit |
| `DEFAULT_TIME_FILTER` | `week` | 时间过滤器：`hour`, `day`, `week`, `month`, `year`, `all` |
| `DEFAULT_LIMIT` | `10` | 获取帖子数量 |
| `DEFAULT_TIMEOUT` | `10000` | 请求超时时间（毫秒） |
| `DEEPSEEK_MODEL` | `deepseek-chat` | DeepSeek 模型 |

### 输出说明

生成的 Markdown 文件将保存在 `./output` 目录，文件名格式：

```
{subreddit}_YYYY-MM-DD_HHmmss.md
```

例如：`ObsidianMD_2026-01-14_151441.md`

---

## 构建方法

### 使用 Makefile（推荐）

项目提供了功能完整的 Makefile，支持以下操作：

#### 安装与设置

```bash
make help              # 显示所有可用命令
make install           # 安装生产依赖
make install-dev       # 安装所有依赖（包括开发依赖）
make setup             # 完整设置（安装依赖 + 创建 .env 文件）
```

#### 测试

```bash
make test              # 运行所有测试
make test-verbose      # 运行测试（详细输出）
make test-watch        # 监视模式运行测试（需要 nodemon）
```

#### 代码质量

```bash
make lint              # 运行 ESLint 检查
make lint-fix          # 自动修复 lint 问题
make format            # 格式化代码（需要 Prettier）
make check             # 运行完整质量检查（lint + test）
```

#### 应用运行

```bash
make run               # 运行应用程序
make dev               # 开发模式运行（热重载）
```

#### 清理

```bash
make clean             # 清理输出目录和临时文件
make clean-all         # 深度清理（包括 node_modules）
make distclean         # 完全清理（包括 Docker 资源）
```

#### CI/CD

```bash
make ci                # CI 流水线：安装、lint、测试
make ci-docker         # Docker CI 流水线：构建和测试
make pre-commit        # 提交前检查
```

#### Docker

```bash
make docker-build              # 构建 Docker 镜像
make docker-build-test         # 构建测试镜像
make docker-run                # 运行 Docker 容器
make docker-test               # 在 Docker 中运行测试
make docker-compose-build      # 使用 Docker Compose 构建
make docker-compose-run        # 使用 Docker Compose 运行
make docker-compose-test       # 使用 Docker Compose 运行测试
make docker-clean              # 清理 Docker 资源
```

#### 信息

```bash
make info              # 显示项目和环境信息
make version           # 显示版本信息
```

---

## Docker 部署

### 使用 Docker 构建

```bash
# 构建镜像
docker build -t redditx2md:latest .

# 运行容器
docker run --rm \
  --env-file .env \
  -v $(pwd)/output:/usr/src/app/output \
  redditx2md:latest
```

### 使用 Docker Compose

```bash
# 构建并运行
docker-compose up --build

# 运行测试
docker-compose --profile test run --rm test
```

---

## 项目结构

```
redditx2md/
├── index.js              # 主入口文件
├── lib/                  # 核心库模块
│   ├── constants.js      # 配置常量
│   ├── processor.js      # 内容清洗和文件名生成
│   ├── reddit.js         # Reddit API 客户端
│   ├── deepseek.js       # DeepSeek API 客户端
│   ├── generator.js      # Markdown 文件生成器
│   └── types.js          # 类型定义
├── tests/                # 测试文件
│   ├── processor.test.js
│   └── reddit.test.js
├── output/               # 生成的 Markdown 文件
├── specs/                # 项目规范文档
│   └── feature_design_v1.md
├── constitution.md       # 项目开发宪法
├── CLAUDE.md             # Claude AI 开发指南
├── Makefile              # 构建自动化
├── Dockerfile            # Docker 镜像定义
├── docker-compose.yml    # Docker Compose 配置
├── package.json          # 项目配置
├── .env.example          # 环境变量示例
└── README.md             # 项目文档
```

---

## 架构设计

项目遵循模块化设计原则，各层职责清晰：

1. **数据获取层** (`lib/reddit.js`)
   - 使用 axios 请求 Reddit API
   - 注入自定义 User-Agent（宪法要求）
   - 完善的错误处理（403/429/Timeout）

2. **内容处理层** (`lib/processor.js`, `lib/deepseek.js`)
   - HTML 实体转义处理
   - 空白字符标准化
   - AI 翻译和总结
   - 批量并行处理

3. **输出生成层** (`lib/generator.js`)
   - Markdown 格式化
   - 文件系统操作
   - 时间戳文件名

---

## API 参考

### `fetchTopPosts(subreddit, options)`

从 Reddit 获取热门帖子。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `subreddit` | string | `'ObsidianMD'` | Subreddit 名称（不含 r/） |
| `options.limit` | number | `10` | 获取帖子数量 |
| `options.timeFilter` | string | `'week'` | 时间过滤（day, week, month, year, all） |
| `options.timeout` | number | `10000` | 请求超时时间（毫秒） |

### `processPosts(posts, apiKey, options)`

使用 DeepSeek 批量处理帖子翻译。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `posts` | Array | 必填 | 帖子数组 |
| `apiKey` | string | 必填 | DeepSeek API Key |
| `options.batchSize` | number | `3` | 每批处理的帖子数量 |
| `options.batchDelayMs` | number | `1000` | 批次间延迟（毫秒） |

### `saveMarkdown(subreddit, posts, outputDir)`

生成并保存 Markdown 文件。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `subreddit` | string | 必填 | Subreddit 名称 |
| `posts` | Array | 必填 | 处理后的帖子数组 |
| `outputDir` | string | `'./output'` | 输出目录路径 |

---

## 输出格式

生成的 Markdown 文件包含以下内容：

```markdown
# r/ObsidianMD 热门帖子 (翻译)

## [翻译后的标题](https://reddit.com/r/...)

**Author:** u/username | **Score:** 1234

### 摘要
AI 生成的中文总结...

### 正文
翻译后的正文内容...

> 原标题: Original Title

---
```

---

## 错误处理

程序处理以下错误情况：

| 错误类型 | 错误码 | 处理方式 |
|----------|--------|----------|
| Reddit 403 | `FORBIDDEN` | 记录并退出 |
| Reddit 429 | `RATE_LIMIT` | 记录并退出 |
| 请求超时 | `TIMEOUT` | 记录并退出 |
| 网络错误 | `NETWORK_ERROR` | 记录并退出 |
| DeepSeek 401 | `DEEPSEEK_AUTH_ERROR` | 记录并退出 |
| DeepSeek 429 | `DEEPSEEK_RATE_LIMIT` | 记录并退出 |
| DeepSeek 5xx | `DEEPSEEK_SERVER_ERROR` | 记录并退出 |

所有错误都会被透明地记录到控制台，包含详细的上下文信息用于调试。

---

## 开发规范

本项目严格遵循以下开发原则（定义于 `constitution.md`）：

1. **极简主义**：拒绝过度工程，只实现当前需求
2. **数据客观性**：保证数据原始性，明确标注 AI 生成内容
3. **鲁棒性**：自定义 User-Agent，完善异常处理
4. **代码清晰度**：职责分离，ESM 规范

### TDD 开发流程

1. 先编写测试骨架（`tests/`）
2. 运行并验证测试
3. 编写业务逻辑代码
4. 确保测试通过

### Git 提交规范

使用 Conventional Commits 格式：

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
refactor: 代码重构
test: 测试相关
chore: 构建/工具链相关
```

---

## 贡献

欢迎提交 Issue 和 Pull Request！

在贡献代码前，请确保：

1. 运行 `make check` 确保所有检查通过
2. 遵循项目的开发宪法（`constitution.md`）
3. 使用 Conventional Commits 格式提交

---

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 相关链接

- [DeepSeek Platform](https://platform.deepseek.com/) - 获取 API Key
- [Reddit API 文档](https://www.reddit.com/dev/api/)
- [Node.js 文档](https://nodejs.org/docs)

---

**Made with ❤️ by the redditx2md team**
