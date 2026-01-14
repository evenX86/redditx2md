# redditx2md 任务分解列表 (Task Breakdown)
**生成日期**: 2026-01-14
**状态**: 待执行
**基于**: plan.md + feature_design_v1.md

---

## 使用说明

### 任务标记约定
- **[P]**: 可与其他标记为 [P] 的任务并行执行
- **[→ Task X.Y]**: 依赖 Task X.Y，必须在其完成后执行
- **TDD**: 测试驱动开发，测试任务必须在实现任务之前完成

### 执行流程
```
Phase 1 (Foundation) → Phase 2 (Processor) → Phase 3 (Fetcher) → Phase 3.5 (DeepSeek) → Phase 4 (Integrator)
```

---

## Phase 1: Foundation (环境初始化与基础配置)

### Task 1.1 [P] - 验证 package.json 配置
**目标**: 确保 package.json 符合 ESM 和依赖要求

**涉及文件**: `package.json`

**验收标准**:
- [ ] `"type": "module"` 存在
- [ ] `axios` 版本为 `^1.7.9`
- [ ] `dotenv` 版本为 `^16.4.7`
- [ ] `"test"` 脚本设置为 `node --test`
- [ ] Node.js 引擎要求 `>= 20.x`

**执行动作**: 验证（如已正确配置则无需修改）

---

### Task 1.2 [P] - 创建 .env.example 模板
**目标**: 提供环境变量配置模板

**涉及文件**: `.env.example`

**验收标准**:
- [ ] 文件包含 `DEEPSEEK_API_KEY=sk-your-api-key-here`
- [ ] 文件包含注释说明用途

**输出内容**:
```bash
# DeepSeek API 配置
# 获取地址: https://platform.deepseek.com/
DEEPSEEK_API_KEY=sk-your-api-key-here
```

---

### Task 1.3 [→ Task 1.1] - 验证 .gitignore 排除规则
**目标**: 确保敏感文件不被提交

**涉及文件**: `.gitignore`

**验收标准**:
- [ ] 包含 `node_modules/`
- [ ] 包含 `.env`
- [ ] 包含 `output/`

**执行动作**: 验证或添加缺失条目

---

## Phase 2: Data Processor (内容清洗与格式化)

### Task 2.1 (TDD) - processor.js 单元测试套件
**目标**: 定义 processor.js 的测试断言

**涉及文件**: `tests/processor.test.js`

**验收标准**:
- [ ] 测试文件使用 `node:test` 框架
- [ ] 包含 `cleanContent()` HTML 实体还原测试
- [ ] 包含 `cleanContent()` 空行压缩测试
- [ ] 包含 `cleanContent()` null/undefined 回退测试
- [ ] 包含 `generateFileName()` 格式验证测试

**测试用例清单**:
```javascript
describe('processor.js', () => {
  describe('cleanContent()', () => {
    it('应还原 &amp; → &')
    it('应还原 &lt; → <')
    it('应还原 &gt; → >')
    it('应还原 &quot; → "')
    it('应压缩 \n\n\n → \n\n')
    it('应压缩 \n\n\n\n → \n\n')
    it('null 应返回 "(No Content Body)"')
    it('undefined 应返回 "(No Content Body)"')
    it('空字符串应返回 "(No Content Body)"')
    it('应 trim 首尾空白')
  })

  describe('generateFileName()', () => {
    it('应返回 {subreddit}_YYYY-MM-DD_HHmmss.md 格式')
    it('年份应为 4 位数字')
    it('月份/日期/时/分/秒应为 2 位补零')
  })
})
```

---

### Task 2.2 [→ Task 2.1] - 实现 unescapeHtml() 函数
**目标**: 实现 HTML 实体还原逻辑

**涉及文件**: `lib/processor.js`

**验收标准**:
- [ ] 创建内部函数 `unescapeHtml(text)`
- [ ] 支持实体映射: `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&#x27;`, `&apos;`
- [ ] 使用正则表达式 `/&[a-zA-Z0-9#]+;/g` 匹配实体
- [ ] 未映射实体保持原样

**实现要点**:
```javascript
function unescapeHtml(text) {
  if (!text) return '';
  const htmlEntities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&apos;': "'"
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => htmlEntities[entity] || entity);
}
```

---

### Task 2.3 [→ Task 2.2] - 实现 cleanContent() 函数
**目标**: 实现内容清洗导出函数

**涉及文件**: `lib/processor.js`

**验收标准**:
- [ ] 导出函数签名: `export function cleanContent(text)`
- [ ] null/undefined/空字符串 返回 `'(No Content Body)'`
- [ ] 调用 `unescapeHtml()` 还原 HTML 实体
- [ ] 使用 `/\n{3,}/g` 压缩 3 个及以上换行符为 2 个
- [ ] 调用 `.trim()` 移除首尾空白

**实现要点**:
```javascript
export function cleanContent(text) {
  if (text === null || text === undefined || text === '') {
    return '(No Content Body)';
  }
  let result = unescapeHtml(text);
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}
```

---

### Task 2.4 [→ Task 2.3] - 实现 generateFileName() 函数
**目标**: 实现时间戳文件名生成

**涉及文件**: `lib/processor.js`

**验收标准**:
- [ ] 导出函数签名: `export function generateFileName(subreddit)`
- [ ] 返回格式: `{subreddit}_YYYY-MM-DD_HHmmss.md`
- [ ] 年份 4 位，其他时间组件 2 位补零
- [ ] 使用 `String().padStart(2, '0')` 格式化

---

### Task 2.5 [→ Task 2.4] - 运行 processor.js 测试
**目标**: 验证 processor.js 实现正确性

**涉及文件**: `tests/processor.test.js`, `lib/processor.js`

**验收标准**:
- [ ] 运行 `npm test` 全部通过
- [ ] 测试覆盖率: 所有导出函数均有测试

**执行动作**:
```bash
npm test
```

---

## Phase 3: Reddit Fetcher (Axios 封装与 API 交互)

### Task 3.1 (TDD) - fetcher.js 单元测试套件
**目标**: 定义 fetcher.js 的测试断言

**涉及文件**: `tests/fetcher.test.js`

**验收标准**:
- [ ] 测试 429 错误应抛出 `code: 'RATE_LIMIT'`
- [ ] 测试 403 错误应抛出 `code: 'FORBIDDEN'`
- [ ] 测试超时应抛出 `code: 'TIMEOUT'`
- [ ] 测试成功响应应返回 Post 数组

**测试用例清单**:
```javascript
describe('fetcher.js', () => {
  describe('fetchRedditPosts()', () => {
    it('429 响应应抛出包含 code=RATE_LIMIT 的错误')
    it('403 响应应抛出包含 code=FORBIDDEN 的错误')
    it('超时应抛出包含 code=TIMEOUT 的错误')
    it('成功响应应提取 data.children[].data')
    it('成功响应应返回 Post 数组')
  })
})
```

---

### Task 3.2 [→ Task 3.1] - 定义 User-Agent 常量
**目标**: 声明自定义 UA 头（constitution.md 第三条 3.1 强制要求）

**涉及文件**: `lib/fetcher.js`

**验收标准**:
- [ ] 常量名: `CUSTOM_USER_AGENT`
- [ ] 值: `'redditx2md/1.0 (Content Converter)'`
- [ ] 位于文件顶部，注释说明用途

**实现要点**:
```javascript
// 自定义 User-Agent (constitution.md 第三条 3.1 强制要求)
const CUSTOM_USER_AGENT = 'redditx2md/1.0 (Content Converter)';
```

---

### Task 3.3 [→ Task 3.2] - 实现 fetchRedditPosts() 函数 - 基础结构
**目标**: 实现函数签名和参数处理

**涉及文件**: `lib/fetcher.js`

**验收标准**:
- [ ] 导出函数签名: `export async function fetchRedditPosts(subreddit, options)`
- [ ] 默认参数: `subreddit = 'ObsidianMD'`, `timeFilter = 'week'`, `limit = 10`, `timeout = 10000`
- [ ] 构造 URL: `https://www.reddit.com/r/${subreddit}/top.json`

---

### Task 3.4 [→ Task 3.3] - 注入 User-Agent 到 axios 请求
**目标**: 确保 UA 头正确注入（constitution.md 第三条 3.1 强制要求）

**涉及文件**: `lib/fetcher.js`

**验收标准**:
- [ ] axios 配置包含 `headers: { 'User-Agent': CUSTOM_USER_AGENT }`
- [ ] 不使用 axios 默认 UA

**实现要点**:
```javascript
const response = await axios.get(url, {
  params: { limit, t: timeFilter },
  headers: { 'User-Agent': CUSTOM_USER_AGENT },
  timeout
});
```

---

### Task 3.5 [→ Task 3.4] - 实现 429 错误捕获
**目标**: 捕获 Reddit API Rate Limit 错误

**涉及文件**: `lib/fetcher.js`

**验收标准**:
- [ ] 检测 `error.response?.status === 429`
- [ ] 抛出新 Error，包含 `code: 'RATE_LIMIT'`
- [ ] 保留原始 error 到 `error.originalError`

**实现要点**:
```javascript
if (error.response?.status === 429) {
  const rateLimitError = new Error('API Rate Limit exceeded. Please try again later.');
  rateLimitError.code = 'RATE_LIMIT';
  rateLimitError.originalError = error;
  throw rateLimitError;
}
```

---

### Task 3.6 [→ Task 3.5] - 实现 403 错误捕获
**目标**: 捕获 Reddit API Forbidden 错误

**涉及文件**: `lib/fetcher.js`

**验收标准**:
- [ ] 检测 `error.response?.status === 403`
- [ ] 抛出新 Error，包含 `code: 'FORBIDDEN'`

---

### Task 3.7 [→ Task 3.6] - 实现超时错误捕获
**目标**: 捕获网络超时错误

**涉及文件**: `lib/fetcher.js`

**验收标准**:
- [ ] 检测 `error.code === 'ECONNABORTED'` 或 `error.message.includes('timeout')`
- [ ] 抛出新 Error，包含 `code: 'TIMEOUT'`

---

### Task 3.8 [→ Task 3.7] - 实现成功响应数据处理
**目标**: 提取并返回 Post 数组

**涉及文件**: `lib/fetcher.js`

**验收标准**:
- [ ] 提取路径: `response.data?.data?.children || []`
- [ ] 返回: `posts.map(post => post.data)`
- [ ] 空数组安全处理

---

### Task 3.9 [→ Task 3.8] - 运行 fetcher.js 测试
**目标**: 验证 fetcher.js 实现正确性

**涉及文件**: `tests/fetcher.test.js`, `lib/fetcher.js`

**验收标准**:
- [ ] 运行 `npm test` 全部通过
- [ ] 所有错误场景均有测试覆盖

**执行动作**:
```bash
npm test
```

---

## Phase 3.5: DeepSeek Translator (AI 翻译与总结)

### Task 3.5.1 (TDD) - deepseek.js 单元测试套件
**目标**: 定义 deepseek.js 的测试断言

**涉及文件**: `tests/deepseek.test.js`

**验收标准**:
- [ ] 测试空字符串返回原值
- [ ] 测试 API 调用参数正确性
- [ ] 测试 401 错误处理
- [ ] 测试 processPosts() 保留原始字段

**测试用例清单**:
```javascript
describe('deepseek.js', () => {
  describe('translateText()', () => {
    it('空字符串应返回原值')
    it('应调用 DeepSeek API，temperature=0.1')
    it('应返回翻译结果')
  })

  describe('summarizeText()', () => {
    it('空字符串应返回 "(无内容)"')
    it('应调用 DeepSeek API，temperature=0.5')
    it('应返回总结结果')
  })

  describe('processPost()', () => {
    it('应保留 _originalTitle')
    it('应保留 _originalSelftext')
    it('空 selftext 应设置回退值')
  })

  describe('processPosts()', () => {
    it('应串行处理所有帖子')
    it('应输出进度日志')
  })
})
```

---

### Task 3.5.2 - 定义 DeepSeek API 常量
**目标**: 声明 API 端点和模型配置

**涉及文件**: `lib/deepseek.js`

**验收标准**:
- [ ] 常量 `DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'`
- [ ] 常量 `MODEL = 'deepseek-chat'`

---

### Task 3.5.3 [→ Task 3.5.2] - 实现 callDeepSeek() 内部函数
**目标**: 实现通用 API 调用函数

**涉及文件**: `lib/deepseek.js`

**验收标准**:
- [ ] 函数签名: `async function callDeepSeek(prompt, apiKey, options = {})`
- [ ] 默认 `temperature = 0.3`, `maxTokens = 2000`
- [ ] axios POST 请求包含 Authorization 头
- [ ] 返回 `response.data.choices[0].message.content`

**实现要点**:
```javascript
const response = await axios.post(DEEPSEEK_API_URL, {
  model: MODEL,
  messages: [{ role: 'user', content: prompt }],
  temperature,
  max_tokens: maxTokens
}, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});
```

---

### Task 3.5.4 [→ Task 3.5.3] - 实现 translateText() 函数
**目标**: 实现英译中功能

**涉及文件**: `lib/deepseek.js`

**验收标准**:
- [ ] 导出函数签名: `export async function translateText(text, apiKey)`
- [ ] 空字符串返回原值
- [ ] Prompt: "将以下英文翻译成中文，只返回翻译结果，不要添加任何解释：\n\n${text}"
- [ ] 调用 `callDeepSeek()` 时 `temperature: 0.1`

---

### Task 3.5.5 [→ Task 3.5.4] - 实现 summarizeText() 函数
**目标**: 实现总结功能

**涉及文件**: `lib/deepseek.js`

**验收标准**:
- [ ] 导出函数签名: `export async function summarizeText(text, apiKey)`
- [ ] 空字符串返回 `'(无内容)'`
- [ ] Prompt: "请用中文对以下内容进行简洁的总结（2-3句话）：\n\n${text}"
- [ ] 调用 `callDeepSeek()` 时 `temperature: 0.5`

---

### Task 3.5.6 [→ Task 3.5.5] - 实现 processPost() 函数 - 基础结构
**目标**: 实现单个帖子处理逻辑

**涉及文件**: `lib/deepseek.js`

**验收标准**:
- [ ] 导出函数签名: `export async function processPost(post, apiKey)`
- [ ] 保留原始字段: `...post, _originalTitle, _originalSelftext`
- [ ] 导入 `cleanContent` from `./processor.js`
- [ ] 在翻译前对原始内容调用 `cleanContent()`

**集成要点**（修复 Phase 2 与 Phase 3.5 断层）:
```javascript
import { cleanContent } from './processor.js';

export async function processPost(post, apiKey) {
  const result = {
    ...post,
    _originalTitle: post.title,
    _originalSelftext: post.selftext
  };

  // 先清洗，再翻译
  if (post.title) {
    const cleanedTitle = cleanContent(post.title);
    result.title = await translateText(cleanedTitle, apiKey);
  }

  if (post.selftext && post.selftext.trim()) {
    const cleanedSelftext = cleanContent(post.selftext);
    result.selftext = await translateText(cleanedSelftext, apiKey);
    result.summary = await summarizeText(cleanedSelftext, apiKey);
  } else {
    result.selftext = '(No Content Body)';
    result.summary = '(无正文内容)';
  }

  return result;
}
```

---

### Task 3.5.7 [→ Task 3.5.6] - 实现 processPosts() 函数
**目标**: 实现批量处理逻辑

**涉及文件**: `lib/deepseek.js`

**验收标准**:
- [ ] 导出函数签名: `export async function processPosts(posts, apiKey)`
- [ ] 串行处理（避免并发限制）
- [ ] 输出进度日志: `Translating post ${i+1}/${length}...`
- [ ] 返回处理后的数组

---

### Task 3.5.8 [→ Task 3.5.7] - 运行 deepseek.js 测试
**目标**: 验证 deepseek.js 实现正确性

**涉及文件**: `tests/deepseek.test.js`, `lib/deepseek.js`

**验收标准**:
- [ ] 运行 `npm test` 全部通过

**执行动作**:
```bash
npm test
```

---

## Phase 4: Integrator & CLI (文件持久化与主入口)

### Task 4.1 (TDD) - generator.js 单元测试套件
**目标**: 定义 generator.js 的测试断言

**涉及文件**: `tests/generator.test.js`

**验收标准**:
- [ ] 测试空列表返回 "*No posts found.*"
- [ ] 测试 Markdown 格式正确性
- [ ] 测试原文引用格式

**测试用例清单**:
```javascript
describe('generator.js', () => {
  describe('generateMarkdown()', () => {
    it('空数组应返回 "*No posts found.*"')
    it('应包含标题 "# r/{subreddit} 热门帖子 (翻译)"')
    it('应包含 "## [中文标题](链接)" 格式')
    it('应包含 "**Author:** {author} | **Score:** {score}"')
    it('应包含 "> 原标题: {original}" 引用')
    it('应使用 "---" 分隔帖子')
  })

  describe('saveMarkdown()', () => {
    it('应创建输出目录（如不存在）')
    it('应返回 filePath 和 content')
  })
})
```

---

### Task 4.2 [→ Task 2.4] - 实现 generateMarkdown() 函数 - 基础结构
**目标**: 实现 Markdown 内容生成

**涉及文件**: `lib/generator.js`

**验收标准**:
- [ ] 导出函数签名: `export function generateMarkdown(subreddit, posts)`
- [ ] 导入 `cleanContent, generateFileName` from `./processor.js`
- [ ] 标题格式: `# r/${subreddit} 热门帖子 (翻译)`

---

### Task 4.3 [→ Task 4.2] - 实现 generateMarkdown() - 空列表处理
**目标**: 处理空帖子列表

**涉及文件**: `lib/generator.js`

**验收标准**:
- [ ] 检测 `!posts || posts.length === 0`
- [ ] 返回 `*No posts found.*`

---

### Task 4.4 [→ Task 4.3] - 实现 generateMarkdown() - 帖子遍历
**目标**: 生成单个帖子 Markdown

**涉及文件**: `lib/generator.js`

**验收标准**:
- [ ] 标题链接: `## [${title}](${url})`
- [ ] 元数据: `**Author:** ${author} | **Score:** ${score}`
- [ ] 摘要部分（如有 summary）: `### 摘要\n${summary}`
- [ ] 正文部分（如有 selftext）: `### 正文\n${selftext}`
- [ ] 原文引用: `> 原标题: ${_originalTitle}`
- [ ] 分隔符: `---`

---

### Task 4.5 [→ Task 4.4] - 实现 saveMarkdown() 函数
**目标**: 实现文件持久化

**涉及文件**: `lib/generator.js`

**验收标准**:
- [ ] 导出函数签名: `export async function saveMarkdown(subreddit, posts, outputDir = './output')`
- [ ] 调用 `generateMarkdown()` 生成内容
- [ ] 调用 `generateFileName()` 生成文件名
- [ ] 使用 `fs.mkdir(outputDir, { recursive: true })` 创建目录
- [ ] 使用 `fs.writeFile(filePath, content, 'utf-8')` 写入文件
- [ ] 返回 `{ filePath, content }`

---

### Task 4.6 [→ Task 4.5] - 运行 generator.js 测试
**目标**: 验证 generator.js 实现正确性

**涉及文件**: `tests/generator.test.js`, `lib/generator.js`

**验收标准**:
- [ ] 运行 `npm test` 全部通过

**执行动作**:
```bash
npm test
```

---

### Task 4.7 [→ Task 3.8, Task 3.5.7, Task 4.5] - 实现 index.js 主入口
**目标**: 组装全流程

**涉及文件**: `index.js`

**验收标准**:
- [ ] 添加 shebang: `#!/usr/bin/env node`
- [ ] 导入 `dotenv/config`
- [ ] 导入所有模块函数
- [ ] 实现 `async function main()`

---

### Task 4.8 [→ Task 4.7] - 实现 main() - 环境变量检查
**目标**: 检查 DEEPSEEK_API_KEY

**涉及文件**: `index.js`

**验收标准**:
- [ ] 检查 `process.env.DEEPSEEK_API_KEY`
- [ ] 缺失时输出错误并 `process.exit(1)`

---

### Task 4.9 [→ Task 4.8] - 实现 main() - 流程编排
**目标**: 串行调用各模块

**涉及文件**: `index.js`

**验收标准**:
- [ ] 调用 `fetchRedditPosts('ObsidianMD', { timeFilter: 'week', limit: 10, timeout: 10000 })`
- [ ] 调用 `processPosts(posts, apiKey)`
- [ ] 调用 `saveMarkdown(subreddit, translatedPosts)`
- [ ] 输出日志: `Fetching posts...`, `Translating...`, `Generating Markdown...`

---

### Task 4.10 [→ Task 4.9] - 实现 main() - 统一错误处理
**目标**: 捕获并处理所有异常

**涉及文件**: `index.js`

**验收标准**:
- [ ] `try-catch` 包裹全流程
- [ ] 根据 `error.code` 输出对应错误信息:
  - `RATE_LIMIT`: "Error: Rate Limit - ..."
  - `FORBIDDEN`: "Error: Forbidden - ..."
  - `TIMEOUT`: "Error: Timeout - ..."
  - `401`: "Error: DeepSeek API Key 无效或已过期"
- [ ] 所有错误均执行 `process.exit(1)`

---

### Task 4.11 [→ Task 4.10] - 调用 main() 函数
**目标**: 启动程序

**涉及文件**: `index.js`

**验收标准**:
- [ ] 文件末尾调用 `main()`
- [ ] 无参数传递

---

## 验收阶段

### Task 5.1 - 全量测试执行
**目标**: 验证所有功能正常

**执行动作**:
```bash
npm test
```

**验收标准**:
- [ ] 所有测试通过
- [ ] 无 TypeError 或 ReferenceError

---

### Task 5.2 [→ Task 5.1] - 端到端手动测试
**目标**: 验证实际运行效果

**前置条件**:
- [ ] 已配置 `.env` 文件，包含有效 `DEEPSEEK_API_KEY`

**执行动作**:
```bash
npm start
```

**验收标准**:
- [ ] 程序成功运行无错误
- [ ] `./output/` 目录生成新文件
- [ ] 文件名格式正确: `ObsidianMD_YYYY-MM-DD_HHmmss.md`
- [ ] Markdown 内容包含原文引用

---

### Task 5.3 [→ Task 5.2] - 合宪性最终审查
**目标**: 确认所有代码符合 constitution.md

**审查清单**:
- [ ] 第一条 1.2: 仅使用 axios，无其他 HTTP 库
- [ ] 第一条 1.3: 使用 `fs/promises`, `path` 原生模块
- [ ] 第二条 2.1: 保留 `_originalTitle` 和 `_originalSelftext`
- [ ] 第二条 2.2: 缺失字段返回 `(No Content Body)`
- [ ] 第二条 2.3: 所有错误均显式捕获并输出
- [ ] 第三条 3.1: **User-Agent 已注入**（critical）
- [ ] 第三条 3.2: 全链路 `async/await`
- [ ] 第四条 4.3: 无 `require()`，仅使用 `import/export`

---

## 任务统计

| Phase | 任务数量 | 可并行 | 测试任务 | 实现任务 |
|:---|:---|:---|:---|:---|
| Phase 1: Foundation | 3 | 3 | 0 | 3 |
| Phase 2: Processor | 5 | 0 | 1 | 4 |
| Phase 3: Fetcher | 9 | 0 | 1 | 8 |
| Phase 3.5: DeepSeek | 8 | 0 | 1 | 7 |
| Phase 4: Integrator | 11 | 0 | 1 | 10 |
| 验收阶段 | 3 | 0 | 0 | 3 |
| **总计** | **39** | **3** | **4** | **35** |

---

## 依赖关系图

```
Phase 1:
  Task 1.1 ──┐
  Task 1.2 ├──> 无依赖，可并行
  Task 1.3 ──┘

Phase 2:
  Task 2.1 → 2.2 → 2.3 → 2.4 → 2.5

Phase 3:
  Task 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → 3.8 → 3.9

Phase 3.5:
  Task 3.5.1 → 3.5.2 → 3.5.3 → 3.5.4 → 3.5.5 → 3.5.6 → 3.5.7 → 3.5.8
  (依赖 Task 2.4 的 generateFileName)

Phase 4:
  Task 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 → 4.8 → 4.9 → 4.10 → 4.11
  (依赖 Task 2.4, 3.8, 3.5.7, 4.5)

验收阶段:
  Task 5.1 → 5.2 → 5.3
```

---

**任务列表状态**: ✅ 已生成，等待执行
