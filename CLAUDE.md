# CLAUDE.md - redditx2md 项目指南

## 1. 开发环境
- **运行时**: Node.js (>= 20.x, LTS)
- **模块系统**: ES Modules (ESM) - `package.json` 包含 `"type": "module"`
- **核心库**: `axios` (HTTP 请求), `path`, `fs/promises` (文件系统)
- **核心 API**: `https://www.reddit.com/r/ObsidianMD/top.json?limit=10&t=week`

## 2. 强制开发流 (Standard Operating Procedure)
1. **测试先行**: 在编写业务逻辑代码前，必须先运行并验证测试骨架 (`tests/`)。
2. **阻断机制**: 编码过程中如发现设计不可行（如依赖库版本冲突、API 调用限制、架构缺陷等），**严禁直接修改代码绕过设计**。
3. **修正动作**: 若需调整设计，必须严格遵守以下顺序：
    - 更新 `specs/feature_design_v1.md` 文档。
    - 提交文档变更，Commit Message 必须注明 `[Docs Update]`。
    - 文档更新完成后，再根据新设计编写业务代码。

## 3. 编码规范与逻辑
- **HTTP 客户端**: 严格使用 `axios` + 自定义 `User-Agent`。
- **异常处理**: 显式捕获并记录 HTTP 429/403 错误，通过 `try-catch` 确保进程安全。
- **内容清洗**: 还原 HTML 转义字符；压缩 3 行以上的连续空行；Trim 字符串。
- **输出规范**: 保存至 `./output`，文件名 `ObsidianMD_YYYY-MM-DD_HHmmss.md`。

## 4. 测试与验证
- **数据校验**: `selftext` 缺失时回退为 `(No Content Body)`。
- **格式校验**: 链接必须转化为 Markdown `[Title](URL)`。

## 5. Git 规范
- **提交格式**: Conventional Commits (feat, fix, docs, refactor, etc.)。
- **特殊前缀**: 设计变更提交使用 `[Docs Update]`。