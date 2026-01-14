/**
 * lib/reddit.js - Reddit API Fetcher
 * Implements Reddit API data fetching per constitution.md requirements
 *
 * Per constitution.md Article III 3.1: MUST inject custom User-Agent
 * Per constitution.md Article I 1.2: MUST use axios for HTTP requests
 * Per constitution.md Article II 2.3: All errors must be explicitly captured
 */

import axios from 'axios';
import { CUSTOM_USER_AGENT } from './constants.js';

/**
 * Fetch top posts from a subreddit
 *
 * @param {string} subreddit - Subreddit name (e.g., 'ObsidianMD')
 * @param {Object} options - Fetch options
 * @param {string} [options.baseUrl] - Base URL for API (injected by tests)
 * @param {string} [options.timeFilter='week'] - Time filter: 'hour', 'day', 'week', 'month', 'year', 'all'
 * @param {number} [options.limit=10] - Number of posts to fetch
 * @param {number} [options.timeout=10000] - Request timeout in milliseconds
 * @returns {Promise<Array>} - Array of post objects
 * @throws {Error} - With code property: FORBIDDEN, RATE_LIMIT, TIMEOUT, NETWORK_ERROR
 */
export async function fetchTopPosts(subreddit, options = {}) {
  const {
    baseUrl = 'https://www.reddit.com',
    timeFilter = 'week',
    limit = 10,
    timeout = 10000
  } = options;

  // Construct API URL
  const apiUrl = `${baseUrl}/r/${subreddit}/top.json`;

  try {
    // Execute HTTP request with custom User-Agent (Constitution III 3.1 mandatory)
    const response = await axios.get(apiUrl, {
      params: {
        limit,
        t: timeFilter
      },
      headers: {
        'User-Agent': CUSTOM_USER_AGENT
      },
      timeout
    });

    // Extract posts from Reddit response structure: data.data.children[].data
    const children = response.data?.data?.children || [];

    // Flatten structure: map children to their data property
    const posts = children.map(child => child.data).filter(post => post != null);

    return posts;

  } catch (error) {
    // Handle HTTP errors with specific status codes
    if (error.response) {
      const statusCode = error.response.status;

      if (statusCode === 403) {
        const forbiddenError = new Error('Forbidden: Access denied by Reddit API');
        forbiddenError.code = 'FORBIDDEN';
        forbiddenError.originalError = error;
        console.error(`[Error] 403 Forbidden: ${forbiddenError.message}`);
        throw forbiddenError;
      }

      if (statusCode === 429) {
        const rateLimitError = new Error('API Rate Limit exceeded');
        rateLimitError.code = 'RATE_LIMIT';
        rateLimitError.originalError = error;
        console.error(`[Error] 429 Rate Limit: ${rateLimitError.message}`);
        throw rateLimitError;
      }
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      const timeoutError = new Error('Request timeout - server did not respond in time');
      timeoutError.code = 'TIMEOUT';
      timeoutError.originalError = error;
      console.error(`[Error] Timeout: ${timeoutError.message}`);
      throw timeoutError;
    }

    // Handle all other network errors
    const networkError = new Error('Network error - unable to reach Reddit API');
    networkError.code = 'NETWORK_ERROR';
    networkError.originalError = error;
    console.error(`[Error] Network: ${networkError.message}`);
    throw networkError;
  }
}
