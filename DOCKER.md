# Docker 使用指南

本文档说明如何使用 Docker 构建和运行 redditx2md 应用。

## 前置要求

- Docker (>= 20.10)
- Docker Compose (>= 2.0) - 可选，用于简化部署

## 快速开始

### 方法 1: 使用 Docker Compose (推荐)

1. **准备环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的 DeepSeek API Key
echo "DEEPSEEK_API_KEY=your_api_key_here" > .env
```

2. **构建并运行**
```bash
# 构建镜像
docker-compose build

# 运行应用
docker-compose run --rm app
```

3. **查看输出**
```bash
# 生成的 Markdown 文件会保存在本地 ./output 目录
ls -la output/
```

### 方法 2: 使用 Docker 命令

1. **构建镜像**
```bash
# 构建生产镜像
docker build -t redditx2md:latest .

# 构建时跳过测试（如果测试失败）
docker build --target builder -t redditx2md:latest .
```

2. **运行容器**
```bash
# 运行应用（通过环境变量传递 API Key）
docker run --rm \
  -e DEEPSEEK_API_KEY=your_api_key_here \
  -v $(pwd)/output:/usr/src/app/output \
  redditx2md:latest
```

3. **使用 .env 文件**
```bash
# 从 .env 文件加载环境变量
docker run --rm \
  --env-file .env \
  -v $(pwd)/output:/usr/src/app/output \
  redditx2md:latest
```

## 高级用法

### 运行测试

```bash
# 使用 Docker Compose 运行测试
docker-compose --profile test run --rm test

# 或直接使用测试目标构建
docker build --target tester -t redditx2md:test .
docker run --rm redditx2md:test
```

### 持久化输出

应用生成的 Markdown 文件默认保存在容器的 `/usr/src/app/output` 目录。

通过 Volume 挂载，文件会同步到宿主机的 `./output` 目录：

```bash
docker run -v $(pwd)/output:/usr/src/app/output redditx2md:latest
```

### 资源限制

Docker Compose 配置已包含资源限制：
- CPU 限制: 1 核心
- 内存限制: 512MB
- CPU 保留: 0.25 核心
- 内存保留: 128MB

可通过 `docker-compose.yml` 中的 `deploy.resources` 部分调整。

## 镜像优化

### 多阶段构建

Dockerfile 采用三阶段构建：

1. **Builder**: 安装所有依赖（包括 devDependencies）
2. **Tester**: 运行测试确保代码质量
3. **Final**: 仅包含生产依赖，最小化镜像体积

### 镜像大小对比

```bash
# 查看镜像大小
docker images redditx2md

# 预期大小（Alpine 基础镜像）
# redditx2md:latest   ~150-200MB
```

### 安全特性

- ✅ 非 root 用户运行 (nodejs:1001)
- ✅ 生产环境变量 (NODE_ENV=production)
- ✅ 最小化依赖 (仅包含 dependencies)
- ✅ 无敏感信息硬编码

## 故障排查

### 构建失败

```bash
# 查看详细构建日志
docker build --no-cache --progress=plain -t redditx2md:latest .
```

### 运行时错误

```bash
# 查看容器日志
docker logs <container_id>

# 以交互模式运行，查看详细输出
docker run --rm -it \
  -e DEEPSEEK_API_KEY=your_key \
  redditx2md:latest
```

### 权限问题

如果输出文件权限不正确：

```bash
# 修正本地 output 目录权限
chmod -R 755 output/
```

### 环境变量未设置

```bash
# 验证环境变量是否正确传递
docker run --rm \
  -e DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY \
  redditx2md:latest \
  node -e "console.log(process.env.DEEPSEEK_API_KEY ? 'API Key set' : 'API Key missing')"
```

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Docker Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t redditx2md:${{ github.sha }} .

      - name: Run tests
        run: docker build --target tester -t redditx2md:test .
```

### GitLab CI 示例

```yaml
build:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t redditx2md:$CI_COMMIT_SHA .
    - docker build --target tester -t redditx2md:test .
```

## 生产部署建议

1. **使用 Docker Secrets 管理 API Key**
```bash
echo "your_api_key" | docker secret create deepseek_api_key -
```

2. **固定镜像版本**
```bash
docker build -t redditx2md:1.0.0 .
docker tag redditx2md:1.0.0 redditx2md:latest
```

3. **定期更新基础镜像**
```bash
docker pull node:20-alpine
docker build --no-cache -t redditx2md:latest .
```

4. **扫描镜像漏洞**
```bash
docker scan redditx2md:latest
```
