/**
 * deepseek.js - DeepSeek API 封装模块
 * 提供翻译和总结功能
 */

import axios from 'axios';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

/**
 * 调用 DeepSeek Chat Completions API
 * @param {string} prompt - 用户提示词
 * @param {string} apiKey - DeepSeek API Key
 * @param {Object} options - 可选配置
 * @returns {Promise<string>} - API 返回的内容
 */
async function callDeepSeek(prompt, apiKey, options = {}) {
  const { temperature = 0.3, maxTokens = 2000 } = options;

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
 * @param {Array} posts - 帖子数组
 * @param {string} apiKey - DeepSeek API Key
 * @returns {Promise<Array>} - 处理后的帖子数组
 */
export async function processPosts(posts, apiKey) {
  const results = [];

  for (let i = 0; i < posts.length; i++) {
    console.log(`Translating post ${i + 1}/${posts.length}...`);
    const processed = await processPost(posts[i], apiKey);
    results.push(processed);
  }

  return results;
}
