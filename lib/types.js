/**
 * lib/types.js - Core data structure definitions
 * Defines the shape of data flowing through the application pipeline
 */

/**
 * Raw Reddit Post structure from Reddit API /top.json endpoint
 * @typedef {Object} RedditPost
 * @property {string} title - Post title
 * @property {string} selftext - Post body content (may be empty)
 * @property {string} url - Source URL
 * @property {number} score - Upvote count
 * @property {string} author - Username
 * @property {string} permalink - Reddit internal path
 */

/**
 * Processed Reddit Post structure after DeepSeek translation
 * @typedef {Object} ProcessedPost
 * @property {string} url - Source URL (preserved)
 * @property {number} score - Upvote count (preserved)
 * @property {string} author - Username (preserved)
 * @property {string} permalink - Reddit internal path (preserved)
 * @property {string} title - Translated Chinese title
 * @property {string} selftext - Translated Chinese body content
 * @property {string} summary - AI-generated Chinese summary
 * @property {string} _originalTitle - Original title (constitution.md Article II 2.1 requirement)
 * @property {string} _originalSelftext - Original body content (constitution.md Article II 2.1 requirement)
 */

/**
 * Axios error with custom code for error handling
 * @typedef {Object} CustomError
 * @property {string} code - Error code: 'RATE_LIMIT' | 'FORBIDDEN' | 'TIMEOUT'
 * @property {string} message - Human-readable error message
 * @property {Error} [originalError] - Original error for debugging
 */

/**
 * File save result
 * @typedef {Object} SaveResult
 * @property {string} filePath - Absolute path to saved file
 * @property {string} content - Markdown content that was saved
 */

/**
 * Fetcher options
 * @typedef {Object} FetcherOptions
 * @property {string} [timeFilter='week'] - Time filter: day, week, month, year, all
 * @property {number} [limit=10] - Number of posts to fetch
 * @property {number} [timeout=10000] - Request timeout in milliseconds
 */

/**
 * DeepSeek API options
 * @typedef {Object} DeepSeekOptions
 * @property {number} [temperature=0.3] - Sampling temperature
 * @property {number} [maxTokens=2000] - Maximum tokens in response
 */

// Export empty object to satisfy ESM module requirements
export {};
