# redditx2md 技术实现方案
**版本**: 1.0
**状态**: 待实施
**批准日期**: 2026-01-14

---

## 1. 技术上下文总结

### 1.1 运行时环境
| 组件 | 规范要求 | 说明 |
|:---|:---|:---|
| **Node.js** | >= 20.x (LTS) | 必须使用 ESM 模式 (`"type": "module"`) |
| **模块系统** | ES Modules | 禁止使用 `require()`，仅支持 `import/export` |
| **测试框架** | Node.js 内置 `node:test` | 无需额外测试库依赖 |

### 1.2 核心依赖库
| 库名称 | 版本 | 用途 |
|:---|:---|:---|
| **axios** | ^1.7.9 | HTTP 客户端（Reddit API + DeepSeek API） |
| **dotenv** | ^16.4.7 | 环境变量管理（`DEEPSEEK_API_KEY`） |

### 1.3 技术约束确认
- **严格使用 axios**：禁止引入其他 HTTP 库（constitution.md 第一条 1.2）
- **优先原生模块**：使用 `node:fs/promises` 和 `node:path`（constitution.md 第一条 1.3）
- **无状态设计**：每次运行独立，无数据库依赖（constitution.md 第三条 3.3）

---

## 2. "合宪性"审查 (Constitutional Compliance Review)

### 2.1 逐条对照审查

| 宪法原则 | 设计响应 | 合规状态 |
|:---|:---|:---|
| **第一条 1.1 (YAGNI)** | 仅实现 r/ObsidianMD Top 10 抓取 | ✅ 合规 |
| **第一条 1.2 (库限制)** | 严格使用 axios，无其他 HTTP 库 | ✅ 合规 |
| **第一条 1.3 (轻量化)** | 使用 `fs/promises`, `path` 原生模块 | ✅ 合规 |
| **第二条 2.1 (AI 增强)** | DeepSeek 翻译/总结，保留原文引用 | ✅ 合规 |
| **第二条 2.2 (透明降级)** | 缺失字段标注 `(No Content Body)` | ✅ 合规 |
| **第二条 2.3 (错误透明)** | 显式捕获并输出 429/403/Timeout | ✅ 合规 |
| **第三条 3.1 (UA 注入)** | 自定义 `User-Agent: redditx2md/1.0` | ✅ 合规 |
| **第三条 3.2 (异步安全)** | 全链路 `async/await` + 错误处理 | ✅ 合规 |
| **第三条 3.3 (无状态)** | 单次运行，无内存状态依赖 | ✅ 合规 |
| **第四条 4.1 (显式命名)** | 使用业务语义变量名 | ✅ 合规 |
| **第四条 4.2 (职责分离)** | Fetcher → DeepSeek → Generator 三层架构 | ✅ 合规 |
| **第四条 4.3 (ESM 规范)** | 严格使用 ES Modules | ✅ 合规 |

### 2.2 合规性结论
**本方案 100% 符合 constitution.md 所有原则，无冲突项。**

---

## 3. 项目模块拆解

### 3.1 模块架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.js (Main)                          │
│  - 环境变量检查 (DEEPSEEK_API_KEY)                               │
│  - 流程编排：fetcher → deepseek → generator                      │
│  - 统一错误处理与退出码管理                                       │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  lib/fetcher.js │  │ lib/deepseek.js │  │ lib/generator.js│
│                 │  │                 │  │                 │
│ 职责：          │  │ 职责：          │  │ 职责：          │
│ • Reddit API  │  │ • 翻译标题/正文  │  │ • Markdown 组装  │
│ • UA 注入      │  │ • AI 总结       │  │ • 文件持久化     │
│ • 429/403 捕获 │  │ • 批量处理      │  │ • 目录创建       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────┐
                                    │ lib/processor.js│
                                    │                 │
                                    │ 职责：          │
                                    │ • HTML 转义还原  │
                                    │ • 空行压缩       │
                                    │ • 文件名生成     │
                                    └─────────────────┘
```

### 3.2 模块职责详解

#### 3.2.1 `lib/fetcher.js` (Fetcher)
| 导出函数 | 功能 | 输入 | 输出 |
|:---|:---|:---|:---|
| `fetchRedditPosts(subreddit, options)` | 获取 Reddit 热门帖子 | `subreddit: string`, `options: {timeFilter, limit, timeout}` | `Promise<Array<Post>>` |

**关键实现细节：**
- UA 头注入：`User-Agent: redditx2md/1.0 (Content Converter)`
- 超时默认值：10000ms
- 429 错误必须抛出包含 `code: 'RATE_LIMIT'` 的 Error 对象
- 403 错误必须抛出包含 `code: 'FORBIDDEN'` 的 Error 对象

#### 3.2.2 `lib/deepseek.js` (Translator)
| 导出函数 | 功能 | 输入 | 输出 |
|:---|:---|:---|:---|
| `translateText(text, apiKey)` | 英译中 | `text: string`, `apiKey: string` | `Promise<string>` |
| `summarizeText(text, apiKey)` | 生成中文总结 | `text: string`, `apiKey: string` | `Promise<string>` |
| `processPosts(posts, apiKey)` | 批量处理帖子 | `posts: Array<Post>`, `apiKey: string` | `Promise<Array<ProcessedPost>>` |

**关键实现细节：**
- API 端点：`https://api.deepseek.com/v1/chat/completions`
- 模型：`deepseek-chat`
- 翻译 temperature：0.1
- 总结 temperature：0.5
- 串行处理（避免并发限制），带进度日志

#### 3.2.3 `lib/processor.js` (Cleaner)
| 导出函数 | 功能 | 输入 | 输出 |
|:---|:---|:---|:---|
| `cleanContent(text)` | 内容清洗 | `text: string` | `string` |
| `generateFileName(subreddit)` | 生成文件名 | `subreddit: string` | `string` |

**关键实现细节：**
- HTML 实体还原映射表：`&amp;` → `&`, `&lt;` → `<`, 等
- 空行压缩：`\n{3,}` → `\n\n`
- 回退字符串：`(No Content Body)`
- 文件名格式：`{subreddit}_YYYY-MM-DD_HHmmss.md`

#### 3.2.4 `lib/generator.js` (Generator)
| 导出函数 | 功能 | 输入 | 输出 |
|:---|:---|:---|:---|
| `generateMarkdown(subreddit, posts)` | 生成 Markdown | `subreddit: string`, `posts: Array<ProcessedPost>` | `string` |
| `saveMarkdown(subreddit, posts, outputDir)` | 保存文件 | `subreddit: string`, `posts: Array<ProcessedPost>`, `outputDir: string` | `Promise<{filePath, content}>` |

**关键实现细节：**
- 使用 `fs.promises.mkdir(outputDir, {recursive: true})` 确保目录存在
- 空列表处理：输出 `*No posts found.*`

#### 3.2.5 `index.js` (Main)
| 函数 | 功能 |
|:---|:---|
| `main()` | 主执行函数，编排全流程 |

**执行流程：**
1. 检查 `DEEPSEEK_API_KEY` 环境变量，缺失则 `process.exit(1)`
2. 调用 `fetchRedditPosts()`
3. 调用 `processPosts()`
4. 调用 `saveMarkdown()`
5. 统一 `try-catch` 捕获所有异常，根据 `error.code` 输出对应错误信息

---

## 4. 核心数据结构

### 4.1 原始 Reddit Post 对象
```javascript
// Reddit API /top.json 返回结构
const RedditPost = {
  title: string,           // 帖子标题
  selftext: string,        // 正文内容（可能为空）
  url: string,             // 来源链接
  score: number,           // 投票数
  author: string,          // 作者名
  permalink: string,       // Reddit 内部路径
  // ... 其他字段忽略
};
```

### 4.2 处理后 Post 对象
```javascript
// 经过 DeepSeek 处理后的结构
const ProcessedPost = {
  // 原始字段（保留）
  url: string,
  score: number,
  author: string,
  permalink: string,

  // 翻译后的字段
  title: string,           // 中文标题

  // AI 增强字段
  selftext: string,        // 翻译后的正文
  summary: string,         // AI 生成的中文总结

  // 原始引用（constitution.md 第二条 2.1 要求）
  _originalTitle: string,  // 原始标题
  _originalSelftext: string // 原始正文
};
```

### 4.3 数据流转图
```
Reddit API Response
       │
       ▼
  RedditPost[] (原始)
       │
       ▼
  ┌─────────────────────┐
  │   DeepSeek 处理      │
  │ • translateText()   │
  │ • summarizeText()   │
  └─────────────────────┘
       │
       ▼
  ProcessedPost[] (增强)
       │
       ▼
  ┌─────────────────────┐
  │   Markdown 生成     │
  │ • generateMarkdown()│
  └─────────────────────┘
       │
       ▼
  ./output/ObsidianMD_YYYY-MM-DD_HHmmss.md
```

---

## 5. 异常阻断策略

### 5.1 异常分类与处理矩阵

| 异常类型 | HTTP 状态码 | `error.code` | 用户可见消息 | 处理动作 |
|:---|:---|:---|---|:---|
| **Rate Limit** | 429 | `RATE_LIMIT` | "API Rate Limit exceeded. Please try again later." | 立即退出，不保存文件 |
| **Forbidden** | 403 | `FORBIDDEN` | "Access forbidden. Check your permissions." | 立即退出，不保存文件 |
| **Timeout** | N/A | `TIMEOUT` | "Request timeout. Reddit API may be slow." | 立即退出，不保存文件 |
| **DeepSeek 认证失败** | 401 | N/A | "DeepSeek API Key 无效或已过期" | 立即退出，不保存文件 |
| **DeepSeek 速率限制** | 429 | N/A | "DeepSeek API Rate Limit exceeded" | 立即退出，不保存文件 |
| **网络错误** | N/A | N/A | 原始错误消息 | 立即退出，不保存文件 |

### 5.2 错误处理流程图
```
┌──────────────────────────────────────────────────────────────┐
│                       main() 执行                            │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ 环境变量检查  │ ──── DEEPSEEK_API_KEY 缺失 ──→ process.exit(1)
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ fetchReddit  │ ──── 429/403/Timeout ─────────→ process.exit(1)
    │   Posts()    │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ processPosts │ ──── DeepSeek API Error ───────→ process.exit(1)
    │   (DeepSeek) │
    └──────────────┘
           │
           ▼
    ┌──────────────┐
    │ saveMarkdown │ ──── 文件系统错误 ──────────────→ process.exit(1)
    └──────────────┘
           │
           ▼
       输出文件路径
```

### 5.3 实现约束
- **不重试机制**：遵循极简主义原则，失败即退出
- **不写入部分文件**：任何异常发生时，不生成不完整的输出文件
- **错误码标准化**：所有自定义错误必须包含 `error.code` 属性

---

## 6. 实施检查清单

### 6.1 代码实现检查点
- [ ] `lib/fetcher.js`：UA 头正确注入
- [ ] `lib/fetcher.js`：429/403/Timeout 错误捕获
- [ ] `lib/deepseek.js`：翻译 temperature = 0.1
- [ ] `lib/deepseek.js`：总结 temperature = 0.5
- [ ] `lib/deepseek.js`：保留 `_originalTitle` 和 `_originalSelftext`
- [ ] `lib/processor.js`：HTML 转义还原完整
- [ ] `lib/processor.js`：空行压缩逻辑正确
- [ ] `lib/processor.js`：回退字符串 `(No Content Body)`
- [ ] `lib/generator.js`：空列表处理 `*No posts found.*`
- [ ] `lib/generator.js`：原文引用格式 `> 原标题: ...`
- [ ] `index.js`：环境变量检查
- [ ] `index.js`：统一错误处理

### 6.2 测试验证检查点
- [ ] 运行 `npm test` 确保所有断言通过
- [ ] 手动验证 DEEPSEEK_API_KEY 缺失时的错误提示
- [ ] 验证输出文件名格式符合 `ObsidianMD_YYYY-MM-DD_HHmmss.md`
- [ ] 验证输出 Markdown 包含原文引用

---

## 7. 附录

### 7.1 文件清单
```
redditx2md/
├── constitution.md              # 项目开发宪法（已更新）
├── specs/feature_design_v1.md   # 功能设计规范
├── plan.md                      # 本文件
├── index.js                     # 主入口
├── lib/
│   ├── fetcher.js              # Reddit API 获取
│   ├── deepseek.js             # DeepSeek 翻译/总结
│   ├── processor.js            # 内容清洗
│   └── generator.js            # Markdown 生成
├── tests/
│   └── feature_spec.test.js    # 功能测试套件
├── output/                      # 输出目录
└── .env                         # 环境变量（不提交）
```

### 7.2 环境变量模板
```bash
# .env 文件模板
DEEPSEEK_API_KEY=sk-your-api-key-here
```

---

**方案状态**: ✅ 合宪性审查通过，等待实施
