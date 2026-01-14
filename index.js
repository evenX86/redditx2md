#!/usr/bin/env node
/**
 * index.js - redditx2md main entry point
 * Reddit content fetcher, translator, and Markdown converter
 */

import 'dotenv/config';
import {
  REDDIT_CONFIG,
  CUSTOM_USER_AGENT,
  DEEPSEEK_CONFIG,
  PROCESSING_CONFIG
} from './lib/constants.js';

/**
 * Main execution function
 * Orchestrates the pipeline: Fetcher → DeepSeek → Generator
 */
async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  // Environment variable validation
  if (!apiKey) {
    console.error('Error: DEEPSEEK_API_KEY environment variable not set');
    console.error('Please set: export DEEPSEEK_API_KEY=your_key_here');
    console.error('Or create a .env file with DEEPSEEK_API_KEY');
    process.exit(1);
  }

  console.log(`Configuration loaded:`);
  console.log(`  Subreddit: ${REDDIT_CONFIG.DEFAULT_SUBREDDIT}`);
  console.log(`  Time Filter: ${REDDIT_CONFIG.DEFAULT_TIME_FILTER}`);
  console.log(`  Limit: ${REDDIT_CONFIG.DEFAULT_LIMIT}`);
  console.log(`  Timeout: ${REDDIT_CONFIG.DEFAULT_TIMEOUT}ms`);
  console.log(`  User-Agent: ${CUSTOM_USER_AGENT}`);
  console.log(`  DeepSeek Model: ${DEEPSEEK_CONFIG.MODEL}\n`);

  console.log('Phase 1 Foundation: Skeleton initialized.');
  console.log('Next: Implement Phase 2 (Data Processor) with TDD.\n');

  // TODO: Phase 2 - Import and call cleanContent(), generateFileName()
  // TODO: Phase 3 - Import and call fetchRedditPosts()
  // TODO: Phase 3.5 - Import and call processPosts()
  // TODO: Phase 4 - Import and call saveMarkdown()

  process.exit(0);
}

// Execute main function
main();
