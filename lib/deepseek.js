/**
 * deepseek.js - DeepSeek API 封装模块
 * 提供翻译和总结功能
 *
 * Per constitution.md Article II 2.3: All errors must be explicitly captured
 * Per constitution.md Article III 3.2: All async operations must handle Promise Rejection
 */

import axios from 'axios';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

/**
 * 调用 DeepSeek Chat Completions API
 * Per constitution.md Article II 2.3: Explicit error capture and logging
 *
 * @param {string} prompt - 用户提示词
 * @param {string} apiKey - DeepSeek API Key
 * @param {Object} options - 可选配置
 * @param {number} [options.temperature=0.3] - Temperature 参数
 * @param {number} [options.maxTokens=2000] - 最大 token 数
 * @returns {Promise<string>} - API 返回的内容
 * @throws {Error} - 包含 code 属性的错误对象
 */
async function callDeepSeek(prompt, apiKey, options = {}) {
  const { temperature = 0.3, maxTokens = 2000 } = options;

  try {
    const response = await axios.post(DEEPSEEK_API_URL, {
      model: MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;

  } catch (error) {
    // 处理 DeepSeek API 错误 - Per constitution II 2.3
    if (error.response) {
      const statusCode = error.response.status;

      if (statusCode === 401) {
        const authError = new Error('DeepSeek API: Invalid API Key');
        authError.code = 'DEEPSEEK_AUTH_ERROR';
        authError.originalError = error;
        console.error(`[Error] DeepSeek 401: ${authError.message}`);
        throw authError;
      }

      if (statusCode === 429) {
        const rateLimitError = new Error('DeepSeek API: Rate Limit exceeded');
        rateLimitError.code = 'DEEPSEEK_RATE_LIMIT';
        rateLimitError.originalError = error;
        console.error(`[Error] DeepSeek 429: ${rateLimitError.message}`);
        throw rateLimitError;
      }

      if (statusCode >= 500) {
        const serverError = new Error(`DeepSeek API: Server error (${statusCode})`);
        serverError.code = 'DEEPSEEK_SERVER_ERROR';
        serverError.originalError = error;
        console.error(`[Error] DeepSeek ${statusCode}: ${serverError.message}`);
        throw serverError;
      }
    }

    // 处理网络错误
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      const timeoutError = new Error('DeepSeek API: Request timeout');
      timeoutError.code = 'DEEPSEEK_TIMEOUT';
      timeoutError.originalError = error;
      console.error(`[Error] DeepSeek Timeout: ${timeoutError.message}`);
      throw timeoutError;
    }

    // 其他网络错误
    const networkError = new Error('DeepSeek API: Network error - unable to reach API');
    networkError.code = 'DEEPSEEK_NETWORK_ERROR';
    networkError.originalError = error;
    console.error(`[Error] DeepSeek Network: ${networkError.message}`);
    throw networkError;
  }
}

/**
 * 翻译英文文本为中文
 * @param {string} text - 要翻译的文本
 * @param {string} apiKey - DeepSeek API Key
 * @returns {Promise<string>} - 翻译后的中文文本
 */
export async function translateText(text, apiKey) {
  if (!text || text.trim() === '') {
    return text;
  }

  const prompt = `将以下英文翻译成中文，只返回翻译结果，不要添加任何解释：\n\n${text}`;
  return await callDeepSeek(prompt, apiKey, { temperature: 0.1 });
}

/**
 * 对文本进行总结
 * @param {string} text - 要总结的文本
 * @param {string} apiKey - DeepSeek API Key
 * @returns {Promise<string>} - 中文总结
 */
export async function summarizeText(text, apiKey) {
  if (!text || text.trim() === '') {
    return '(无内容)';
  }

  const prompt = `请用中文对以下内容进行简洁的总结（2-3句话）：\n\n${text}`;
  return await callDeepSeek(prompt, apiKey, { temperature: 0.5 });
}

/**
 * 处理单个 Reddit 帖子：翻译标题、正文，生成总结
 * @param {Object} post - Reddit 帖子对象
 * @param {string} apiKey - DeepSeek API Key
 * @returns {Promise<Object>} - 处理后的帖子对象
 */
export async function processPost(post, apiKey) {
  console.log(`  Processing: ${post.title?.substring(0, 50)}...`);

  const result = {
    ...post,
    _originalTitle: post.title,
    _originalSelftext: post.selftext
  };

  // 翻译标题
  if (post.title) {
    result.title = await translateText(post.title, apiKey);
  }

  // 翻译正文并生成总结
  if (post.selftext && post.selftext.trim()) {
    result.selftext = await translateText(post.selftext, apiKey);
    result.summary = await summarizeText(post.selftext, apiKey);
  } else {
    result.selftext = '(No Content Body)';
    result.summary = '(无正文内容)';
  }

  return result;
}

/**
 * 批量处理帖子列表
 *
 * 优化：使用并行批处理避免串行等待，同时通过批次间延迟避免触发 API Rate Limit
 *
 * @param {Array} posts - 帖子数组
 * @param {string} apiKey - DeepSeek API Key
 * @param {Object} options - 可选配置
 * @param {number} [options.batchSize=3] - 每批处理的帖子数量
 * @param {number} [options.batchDelayMs=1000] - 批次间延迟（毫秒）
 * @returns {Promise<Array>} - 处理后的帖子数组
 */
export async function processPosts(posts, apiKey, options = {}) {
  const { batchSize = 3, batchDelayMs = 1000 } = options;
  const results = [];

  // 分批并行处理
  for (let i = 0; i < posts.length; i += batchSize) {
    const batchStart = i;
    const batchEnd = Math.min(i + batchSize, posts.length);
    const batch = posts.slice(batchStart, batchEnd);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(posts.length / batchSize)} (posts ${batchStart + 1}-${batchEnd})...`);

    // 并行处理当前批次的所有帖子
    const batchResults = await Promise.all(
      batch.map(post => processPost(post, apiKey))
    );

    results.push(...batchResults);

    // 如果还有更多批次，等待一段时间以避免 Rate Limit
    if (batchEnd < posts.length) {
      console.log(`  Waiting ${batchDelayMs}ms to avoid rate limit...`);
      await new Promise(resolve => setTimeout(resolve, batchDelayMs));
    }
  }

  return results;
}
