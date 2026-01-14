/**
 * fetcher.js - Reddit API 数据获取模块
 */

import axios from 'axios';

// 自定义 User-Agent
const CUSTOM_USER_AGENT = 'redditx2md/1.0 (Content Converter)';

/**
 * 从 Reddit 获取指定子版块的帖子数据
 * @param {string} subreddit - 子版块名称
 * @param {Object} options - 可选配置
 * @param {string} options.timeFilter - 时间筛选 (day, week, month, year, all)
 * @param {number} options.limit - 返回数量限制
 * @param {number} options.timeout - 超时时间（毫秒）
 * @returns {Promise<Array>} - 帖子数据数组
 * @throws {Error} - 包含 "Rate Limit" 关键词的 429 错误
 */
export async function fetchRedditPosts(subreddit = 'ObsidianMD', options = {}) {
  const {
    timeFilter = 'week',
    limit = 10,
    timeout = 10000
  } = options;

  const url = `https://www.reddit.com/r/${subreddit}/top.json`;

  try {
    const response = await axios.get(url, {
      params: {
        limit,
        t: timeFilter
      },
      headers: {
        'User-Agent': CUSTOM_USER_AGENT
      },
      timeout
    });

    // 提取 posts 数据
    const posts = response.data?.data?.children || [];

    return posts.map(post => post.data);

  } catch (error) {
    // 处理 429 Rate Limit 错误
    if (error.response?.status === 429) {
      const rateLimitError = new Error('API Rate Limit exceeded. Please try again later.');
      rateLimitError.code = 'RATE_LIMIT';
      rateLimitError.originalError = error;
      throw rateLimitError;
    }

    // 处理 403 Forbidden 错误
    if (error.response?.status === 403) {
      const forbiddenError = new Error('Access forbidden. Check your permissions.');
      forbiddenError.code = 'FORBIDDEN';
      throw forbiddenError;
    }

    // 处理网络超时
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const timeoutError = new Error('Request timeout. Reddit API may be slow.');
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }

    // 其他错误
    throw error;
  }
}
