#!/usr/bin/env node
/**
 * index.js - redditx2md 主入口
 * Reddit 内容抓取、翻译与 Markdown 转换工具
 */

import 'dotenv/config';
import { fetchRedditPosts } from './lib/fetcher.js';
import { processPosts } from './lib/deepseek.js';
import { saveMarkdown } from './lib/generator.js';

/**
 * 主执行函数
 */
async function main() {
  const subreddit = 'ObsidianMD';
  const apiKey = process.env.DEEPSEEK_API_KEY;

  // 检查 API Key
  if (!apiKey) {
    console.error('Error: DEEPSEEK_API_KEY 环境变量未设置');
    console.error('请设置: export DEEPSEEK_API_KEY=your_key_here');
    console.error('或创建 .env 文件并添加 DEEPSEEK_API_KEY');
    process.exit(1);
  }

  console.log(`Fetching posts from r/${subreddit}...`);

  try {
    // 步骤 1: Fetcher - 获取 Reddit 数据
    const posts = await fetchRedditPosts(subreddit, {
      timeFilter: 'week',
      limit: 10,
      timeout: 10000
    });

    console.log(`Fetched ${posts.length} posts.`);
    console.log('Translating with DeepSeek...');

    // 步骤 2: DeepSeek - 翻译和总结
    const translatedPosts = await processPosts(posts, apiKey);

    console.log('Translation complete.');
    console.log('Generating Markdown...');

    // 步骤 3: Generator - 生成 Markdown 文件
    const result = await saveMarkdown(subreddit, translatedPosts);

    console.log(`\nMarkdown saved to: ${result.filePath}`);

  } catch (error) {
    // 错误处理
    if (error.code === 'RATE_LIMIT') {
      console.error('Error: Rate Limit -', error.message);
    } else if (error.code === 'FORBIDDEN') {
      console.error('Error: Forbidden -', error.message);
    } else if (error.code === 'TIMEOUT') {
      console.error('Error: Timeout -', error.message);
    } else if (error.response?.status === 401) {
      console.error('Error: DeepSeek API Key 无效或已过期');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// 执行主函数
main();
