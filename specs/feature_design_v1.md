# 功能设计规范: Reddit 内容抓取与转换 (v1)

## 1. 核心流程 (Core Pipeline)
1. **Fetcher**: 使用 `axios` 携带自定义 UA 访问 Reddit JSON 接口。
2. **Cleaner**: 还原 HTML 转义，压缩冗余换行。
3. **Generator**: 组装 Markdown 并根据 `ObsidianMD_YYYY-MM-DD_HHmmss.md` 格式持久化。

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