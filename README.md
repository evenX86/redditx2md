# redditx2md

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Type: Module](https://img.shields.io/badge/Type-ES%20Module-blue)](https://nodejs.org/api/esm.html)
[![GitHub Issues](https://img.shields.io/github/issues/evenX86/redditx2md)](https://github.com/evenX86/redditx2md/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/evenX86/redditx2md)](https://github.com/evenX86/redditx2md/pulls)

A Reddit content fetcher and Markdown converter with AI-powered translation support using DeepSeek API.

## Features

- Fetch top posts from any Reddit subreddit
- Convert Reddit posts to clean Markdown format
- AI-powered translation and summarization via DeepSeek API
- Configurable time filters (day, week, month, year, all)
- Batch processing with rate limit protection
- Comprehensive error handling for Reddit API and DeepSeek API

## Requirements

- Node.js >= 20.x (LTS)

## Installation

```bash
# Clone the repository
git clone https://github.com/evenX86/redditx2md.git
cd redditx2md

# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

See `.env.example` for reference.

## Usage

### Basic Usage

```bash
npm start
```

This will fetch the top 10 posts from `r/ObsidianMD` in the past week, translate them, and save to `./output/ObsidianMD_YYYY-MM-DD_HHmmss.md`.

### Custom Subreddit and Options

Edit `index.js` to customize:

```javascript
import { fetchRedditPosts, processPosts, writeMarkdown } from './lib/index.js';

// Fetch posts from custom subreddit
const posts = await fetchRedditPosts('javascript', {
  limit: 20,
  timeFilter: 'month'
});

// Process with DeepSeek translation
const translated = await processPosts(posts, process.env.DEEPSEEK_API_KEY, {
  batchSize: 3,
  batchDelayMs: 1000
});

// Write to file
await writeMarkdown(translated, './output/custom_output.md');
```

## Project Structure

```
redditx2md/
├── lib/
│   ├── reddit.js       # Reddit API fetcher
│   ├── processor.js    # Content processing pipeline
│   ├── deepseek.js     # DeepSeek API wrapper
│   ├── constants.js    # Configuration constants
│   └── types.js        # TypeScript-style JSDoc types
├── tests/
│   ├── reddit.test.js  # Reddit fetcher tests
│   └── processor.test.js # Processor tests
├── specs/              # Design specifications
├── output/             # Generated Markdown files
└── index.js           # Entry point
```

## Development

### Run Tests

```bash
npm test
```

### Code Guidelines

This project follows strict development guidelines outlined in `CLAUDE.md`:

- **TDD Approach**: Tests must be written before implementation
- **Error Handling**: Explicit error capture per `constitution.md` Article II 2.3
- **Documentation**: Design changes require documentation updates first
- **Conventional Commits**: Use standardized commit message format

## API Reference

### `fetchRedditPosts(subreddit, options)`

Fetch posts from Reddit.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `subreddit` | string | `'ObsidianMD'` | Subreddit name (without r/) |
| `options.limit` | number | `10` | Number of posts to fetch |
| `options.timeFilter` | string | `'week'` | Time period (day, week, month, year, all) |
| `options.timeout` | number | `10000` | Request timeout in ms |

### `processPosts(posts, apiKey, options)`

Batch process posts with DeepSeek translation.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `posts` | Array | required | Posts array |
| `apiKey` | string | required | DeepSeek API key |
| `options.batchSize` | number | `3` | Posts per batch |
| `options.batchDelayMs` | number | `1000` | Delay between batches |

## Error Handling

The application handles the following errors explicitly:

- **Reddit API**: 429 (Rate Limit), 403 (Forbidden), Network errors
- **DeepSeek API**: 401 (Auth), 429 (Rate Limit), 500+ (Server errors), Timeout, Network errors

All errors are logged with detailed context for debugging.

## Output Format

Generated Markdown files include:

```markdown
# Title from Reddit

**Author:** u/username | **Score:** 1234 | **Date:** 2024-01-01

[Link to Post](https://reddit.com/r/...)

---

Translated content...

---

**Comments:** 45 | **Post URL:** https://reddit.com/r/...
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## Acknowledgments

- Reddit API for providing public data access
- DeepSeek for AI translation capabilities
- Obsidian community for inspiration
