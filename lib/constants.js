/**
 * lib/constants.js - Project-wide constants
 * Central configuration for API endpoints, defaults, and headers
 */

/**
 * Reddit API Configuration
 */
export const REDDIT_CONFIG = {
  BASE_URL: 'https://www.reddit.com',
  DEFAULT_SUBREDDIT: 'ObsidianMD',
  DEFAULT_TIME_FILTER: 'week',
  DEFAULT_LIMIT: 10,
  DEFAULT_TIMEOUT: 10000
};

/**
 * Custom User-Agent (constitution.md Article III 3.1 mandatory requirement)
 */
export const CUSTOM_USER_AGENT = 'redditx2md/1.0 (Content Converter)';

/**
 * DeepSeek API Configuration
 */
export const DEEPSEEK_CONFIG = {
  API_URL: 'https://api.deepseek.com/v1/chat/completions',
  MODEL: 'deepseek-chat',
  DEFAULT_MAX_TOKENS: 2000,
  TRANSLATE_TEMPERATURE: 0.1,
  SUMMARIZE_TEMPERATURE: 0.5
};

/**
 * Content Processing Defaults
 */
export const PROCESSING_CONFIG = {
  EMPTY_CONTENT_FALLBACK: '(No Content Body)',
  EMPTY_SUMMARY_FALLBACK: '(无内容)',
  NO_SELFTEXT_SUMMARY: '(无正文内容)',
  MAX_NEWLINE_CHARS: 2
};

/**
 * File Output Configuration
 */
export const OUTPUT_CONFIG = {
  DEFAULT_OUTPUT_DIR: './output',
  FILENAME_SEPARATOR: '_'
};
