/**
 * generator.js - Markdown 文件生成模块
 */

import fs from 'fs/promises';
import path from 'path';
import { cleanContent, generateFileName } from './processor.js';

/**
 * 将 Reddit 帖子数据转换为 Markdown 格式
 * @param {string} subreddit - 子版块名称
 * @param {Array} posts - 帖子数据数组（已翻译）
 * @returns {string} - Markdown 内容
 */
export function generateMarkdown(subreddit, posts) {
  const lines = [];

  // 添加标题
  lines.push(`# r/${subreddit} 热门帖子 (翻译)\n`);

  // 处理空列表情况
  if (!posts || posts.length === 0) {
    lines.push('*No posts found.*\n');
    return lines.join('\n');
  }

  // 遍历帖子并生成 Markdown
  for (const post of posts) {
    // 标题（翻译后的中文标题）
    const title = (post.title || '(Untitled)').trim();

    // 来源链接
    const url = post.url || `https://www.reddit.com${post.permalink}`;
    const link = `[${title}](${url})`;

    // 元数据
    const score = post.score || 0;
    const author = post.author || '[unknown]';

    // 组装 Markdown
    lines.push(`## ${link}\n`);
    lines.push(`**Author:** ${author} | **Score:** ${score}\n`);

    // AI 总结部分（如果有）
    if (post.summary && post.summary !== '(无正文内容)' && post.summary !== '(无内容)') {
      lines.push(`\n### 摘要\n`);
      lines.push(`${post.summary}\n`);
    }

    // 翻译后的正文内容
    const selftext = post.selftext || '';
    if (selftext && selftext !== '(No Content Body)' && selftext !== '(无正文内容)') {
      lines.push(`\n### 正文\n`);
      lines.push(`${selftext}\n`);
    }

    // 原文标题引用（如果有）
    if (post._originalTitle) {
      lines.push(`\n> 原标题: ${post._originalTitle}\n`);
    }

    lines.push('---\n');
  }

  return lines.join('\n');
}

/**
 * 保存 Markdown 文件到输出目录
 * @param {string} subreddit - 子版块名称
 * @param {Array} posts - 帖子数据数组
 * @param {string} outputDir - 输出目录路径
 * @returns {Promise<{filePath: string, content: string}>} - 文件路径和内容
 */
export async function saveMarkdown(subreddit, posts, outputDir = './output') {
  // 生成 Markdown 内容
  const content = generateMarkdown(subreddit, posts);

  // 生成文件名
  const fileName = generateFileName(subreddit);
  const filePath = path.join(outputDir, fileName);

  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });

  // 写入文件
  await fs.writeFile(filePath, content, 'utf-8');

  return { filePath, content };
}
