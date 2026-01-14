# 功能设计规范: Reddit 内容抓取与转换 (v2)

## 1. 核心流程 (Core Pipeline)
1. **Fetcher**: 使用 `axios` 携带自定义 UA 访问 Reddit JSON 接口。
2. **Translator**: 使用 DeepSeek API 翻译标题和正文，生成中文摘要。
3. **Generator**: 组装 Markdown（包含翻译、摘要、原文引用）并根据 `ObsidianMD_YYYY-MM-DD_HHmmss.md` 格式持久化。

## 2. 数据契约 (Data Contract)

### 输入 (Reddit JSON) 关键字段
- `data.children[].data.title`: 帖子标题
- `data.children[].data.selftext`: 正文 (Markdown 格式)
- `data.children[].data.url`: 来源链接
- `data.children[].data.score`: 票数
- `data.children[].data.author`: 作者

### 转换规则 (Transformation Rules)
| 原数据 | 处理动作 | 预期输出 |
| :--- | :--- | :--- |
| `&amp;` | 还原字符 | `&` |
| `\n\n\n` | 压缩空行 | `\n\n` |
| `undefined/null` | 容错处理 | `(No Content Body)` |
| `   Title   ` | 修剪首尾 | `Title` |

## 3. 边界条件 (Edge Cases)
- **API 429**: 必须捕获该状态码并抛出带有 "Rate Limit" 关键词的错误。
- **Empty List**: 如果 `children` 为空，生成的 MD 应包含标题但注明 "No posts found"。
- **Network Timeout**: 默认超时设置为 10 秒。

## 4. DeepSeek 翻译配置

### API 配置
- **端点**: `https://api.deepseek.com/v1/chat/completions`
- **模型**: `deepseek-chat`
- **环境变量**: `DEEPSEEK_API_KEY` (通过 `.env` 文件配置)

### 翻译功能
| 功能 | Prompt 模板 | Temperature |
| :--- | :--- | :--- |
| 翻译 | "将以下英文翻译成中文，只返回翻译结果" | 0.1 |
| 总结 | "请用中文对以下内容进行简洁的总结（2-3句话）" | 0.5 |

### 输出格式
```markdown
# r/{subreddit} 热门帖子 (翻译)

## [中文标题](链接)
**Author:** {author} | **Score:** {score}

### 摘要
AI 生成的中文摘要...

### 正文
翻译后的正文内容...

> 原标题: {original_title}

---
```