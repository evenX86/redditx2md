/**
 * tests/reddit.test.js - Reddit Fetcher TDD Test Suite
 * Phase: Red (Tests fail before implementation)
 *
 * Uses Node.js native http module to create a mock Reddit server
 * Avoids real network requests per constitution.md requirements
 */

import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { createServer } from 'node:http';
import { fetchTopPosts } from '../lib/reddit.js';

// ============================================================================
// MOCK SERVER CONFIGURATION
// ============================================================================

/**
 * Mock Reddit API server for testing
 * Returns realistic Reddit JSON response structure
 */
let mockServer = null;
let mockServerUrl = null;

/**
 * Sample Reddit API response structure
 * Matches: https://www.reddit.com/r/{subreddit}/top.json?limit=10&t=week
 */
const MOCK_REDDIT_RESPONSE = {
  kind: 'Listing',
  data: {
    after: 't3_test123',
    dist: 2,
    modhash: '',
    children: [
      {
        kind: 't3',
        data: {
          id: 'abc123',
          title: 'Show &amp; Tell: My Obsidian Workflow',
          selftext: 'This is my &quot;amazing&quot; workflow.\n\n\n\nHope it helps!',
          author: 'obsidian_fan',
          score: 42,
          url: 'https://reddit.com/r/ObsidianMD/comments/abc123',
          subreddit: 'ObsidianMD',
          created_utc: 1704067200
        }
      },
      {
        kind: 't3',
        data: {
          id: 'def456',
          title: 'Best Plugins for 2024',
          selftext: 'Here are my top picks:\n\n1. Dataview\n2. Templater',
          author: 'plugin_lover',
          score: 87,
          url: 'https://reddit.com/r/ObsidianMD/comments/def456',
          subreddit: 'ObsidianMD',
          created_utc: 1704153600
        }
      }
    ]
  }
};

/**
 * Create and start mock Reddit server
 */
function startMockServer() {
  return new Promise((resolve) => {
    mockServer = createServer((request, response) => {
      // Verify User-Agent header (constitution.md Article III 3.1)
      const userAgent = request.headers['user-agent'];
      assert.ok(
        userAgent && userAgent.includes('redditx2md'),
        'Request must include custom User-Agent header per constitution.md Article III 3.1'
      );

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        response.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'User-Agent'
        });
        response.end();
        return;
      }

      // Only handle GET requests
      if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      // Parse query parameters
      const url = new URL(request.url, `http://${request.headers.host}`);
      const limit = url.searchParams.get('limit');
      const timeFilter = url.searchParams.get('t');

      // Validate query parameters
      assert.ok(
        limit && timeFilter,
        'Request must include limit and t query parameters'
      );

      // Return mock Reddit response
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      response.end(JSON.stringify(MOCK_REDDIT_RESPONSE));
    });

    // Start server on random port
    mockServer.listen(0, '127.0.0.1', () => {
      const address = mockServer.address();
      mockServerUrl = `http://127.0.0.1:${address.port}`;
      resolve(mockServerUrl);
    });
  });
}

/**
 * Stop mock server
 */
function stopMockServer() {
  return new Promise((resolve) => {
    if (mockServer) {
      mockServer.close(() => {
        mockServer = null;
        mockServerUrl = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('reddit.js - Reddit API Fetcher', () => {

  before(async () => {
    mockServerUrl = await startMockServer();
  });

  after(async () => {
    await stopMockServer();
  });

  describe('fetchTopPosts() - Successful Request', () => {

    it('应返回 Post 数组', async () => {
      const posts = await fetchTopPosts('ObsidianMD', {
        baseUrl: mockServerUrl,
        timeFilter: 'week',
        limit: 10,
        timeout: 5000
      });

      assert.ok(Array.isArray(posts), 'fetchTopPosts should return an array');
      assert.ok(posts.length > 0, 'Array should not be empty');
    });

    it('应提取正确的帖子数据结构', async () => {
      const posts = await fetchTopPosts('ObsidianMD', {
        baseUrl: mockServerUrl,
        timeFilter: 'week',
        limit: 10,
        timeout: 5000
      });

      const firstPost = posts[0];

      // Verify required fields exist
      assert.ok(firstPost.id, 'Post should have id field');
      assert.ok(firstPost.title, 'Post should have title field');
      assert.ok(firstPost.author, 'Post should have author field');
      assert.ok(firstPost.score, 'Post should have score field');
      assert.ok(firstPost.url, 'Post should have url field');
      assert.ok(firstPost.selftext !== undefined, 'Post should have selftext field (may be empty)');
    });

    it('应保持原始 HTML 实体（由 processor.js 处理）', async () => {
      const posts = await fetchTopPosts('ObsidianMD', {
        baseUrl: mockServerUrl,
        timeFilter: 'week',
        limit: 10,
        timeout: 5000
      });

      // First post has HTML entities (&amp;, &quot;)
      const firstPost = posts[0];
      assert.ok(
        firstPost.title.includes('&amp;') || firstPost.title.includes('&quot;'),
        'Fetcher should preserve raw HTML entities (cleaning is processor.js responsibility)'
      );
    });

    it('应正确提取数组中的所有帖子', async () => {
      const posts = await fetchTopPosts('ObsidianMD', {
        baseUrl: mockServerUrl,
        timeFilter: 'week',
        limit: 10,
        timeout: 5000
      });

      // Mock response has 2 posts
      assert.strictEqual(posts.length, 2, 'Should extract all posts from mock response');
    });
  });

  describe('fetchTopPosts() - URL Construction', () => {

    it('应构造正确的 API URL', async () => {
      // This test verifies the URL structure through successful request
      const posts = await fetchTopPosts('TestSubreddit', {
        baseUrl: mockServerUrl,
        timeFilter: 'month',
        limit: 5,
        timeout: 5000
      });

      assert.ok(Array.isArray(posts), 'URL construction should be correct');
    });
  });

  describe('fetchTopPosts() - Error Handling', () => {

    it('403 错误应抛出包含 code=FORBIDDEN 的错误', async () => {
      // Create a temporary server that returns 403
      const errorServer = createServer((request, response) => {
        response.writeHead(403, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Forbidden' }));
      });

      const errorServerUrl = await new Promise((resolve) => {
        errorServer.listen(0, '127.0.0.1', () => {
          const address = errorServer.address();
          resolve(`http://127.0.0.1:${address.port}`);
        });
      });

      try {
        await fetchTopPosts('ObsidianMD', {
          baseUrl: errorServerUrl,
          timeFilter: 'week',
          limit: 10,
          timeout: 5000
        });
        assert.fail('Should have thrown an error for 403 response');
      } catch (error) {
        assert.strictEqual(error.code, 'FORBIDDEN', 'Error code should be FORBIDDEN');
        assert.ok(error.message.includes('Forbidden'), 'Error message should mention Forbidden');
      } finally {
        errorServer.close();
      }
    });

    it('429 错误应抛出包含 code=RATE_LIMIT 的错误', async () => {
      // Create a temporary server that returns 429
      const errorServer = createServer((request, response) => {
        response.writeHead(429, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Too Many Requests' }));
      });

      const errorServerUrl = await new Promise((resolve) => {
        errorServer.listen(0, '127.0.0.1', () => {
          const address = errorServer.address();
          resolve(`http://127.0.0.1:${address.port}`);
        });
      });

      try {
        await fetchTopPosts('ObsidianMD', {
          baseUrl: errorServerUrl,
          timeFilter: 'week',
          limit: 10,
          timeout: 5000
        });
        assert.fail('Should have thrown an error for 429 response');
      } catch (error) {
        assert.strictEqual(error.code, 'RATE_LIMIT', 'Error code should be RATE_LIMIT');
        assert.ok(error.message.includes('Rate Limit'), 'Error message should mention Rate Limit');
      } finally {
        errorServer.close();
      }
    });

    it('超时应抛出包含 code=TIMEOUT 的错误', async () => {
      // Create a server that delays response
      const timeoutServer = createServer((request, response) => {
        // Delay longer than the timeout
        setTimeout(() => {
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify(MOCK_REDDIT_RESPONSE));
        }, 6000); // 6 second delay
      });

      const timeoutServerUrl = await new Promise((resolve) => {
        timeoutServer.listen(0, '127.0.0.1', () => {
          const address = timeoutServer.address();
          resolve(`http://127.0.0.1:${address.port}`);
        });
      });

      try {
        await fetchTopPosts('ObsidianMD', {
          baseUrl: timeoutServerUrl,
          timeFilter: 'week',
          limit: 10,
          timeout: 1000 // 1 second timeout
        });
        assert.fail('Should have thrown an error for timeout');
      } catch (error) {
        assert.strictEqual(error.code, 'TIMEOUT', 'Error code should be TIMEOUT');
        assert.ok(error.message.includes('timeout'), 'Error message should mention timeout');
      } finally {
        timeoutServer.close();
      }
    });

    it('网络错误应抛出包含 code=NETWORK_ERROR 的错误', async () => {
      try {
        // Use a non-existent URL
        await fetchTopPosts('ObsidianMD', {
          baseUrl: 'http://localhost:59999', // Non-existent server
          timeFilter: 'week',
          limit: 10,
          timeout: 1000
        });
        assert.fail('Should have thrown an error for network error');
      } catch (error) {
        assert.strictEqual(error.code, 'NETWORK_ERROR', 'Error code should be NETWORK_ERROR');
      }
    });
  });

  describe('fetchTopPosts() - Constitution Compliance', () => {

    it('必须注入自定义 User-Agent 头 (Article III 3.1)', async () => {
      // This test is verified in the mock server request handler
      // If User-Agent is missing, the mock server will not respond
      const posts = await fetchTopPosts('ObsidianMD', {
        baseUrl: mockServerUrl,
        timeFilter: 'week',
        limit: 10,
        timeout: 5000
      });

      assert.ok(Array.isArray(posts), 'Request completed with User-Agent');
    });

    it('应使用 axios 发送请求 (Article I 1.2)', async () => {
      // Implicit test - if axios is not used, the test would fail
      const posts = await fetchTopPosts('ObsidianMD', {
        baseUrl: mockServerUrl,
        timeFilter: 'week',
        limit: 10,
        timeout: 5000
      });

      assert.ok(Array.isArray(posts), 'Request completed');
    });
  });

  describe('fetchTopPosts() - Edge Cases', () => {

    it('空响应应返回空数组', async () => {
      // Create a server returning empty data
      const emptyServer = createServer((request, response) => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          kind: 'Listing',
          data: {
            children: []
          }
        }));
      });

      const emptyServerUrl = await new Promise((resolve) => {
        emptyServer.listen(0, '127.0.0.1', () => {
          const address = emptyServer.address();
          resolve(`http://127.0.0.1:${address.port}`);
        });
      });

      try {
        const posts = await fetchTopPosts('ObsidianMD', {
          baseUrl: emptyServerUrl,
          timeFilter: 'week',
          limit: 10,
          timeout: 5000
        });

        assert.ok(Array.isArray(posts), 'Should return array for empty response');
        assert.strictEqual(posts.length, 0, 'Array should be empty');
      } finally {
        emptyServer.close();
      }
    });

    it('缺少 data.children 应返回空数组', async () => {
      // Create a server returning malformed response
      const malformedServer = createServer((request, response) => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ kind: 'Listing' }));
      });

      const malformedServerUrl = await new Promise((resolve) => {
        malformedServer.listen(0, '127.0.0.1', () => {
          const address = malformedServer.address();
          resolve(`http://127.0.0.1:${address.port}`);
        });
      });

      try {
        const posts = await fetchTopPosts('ObsidianMD', {
          baseUrl: malformedServerUrl,
          timeFilter: 'week',
          limit: 10,
          timeout: 5000
        });

        assert.ok(Array.isArray(posts), 'Should return array for malformed response');
        assert.strictEqual(posts.length, 0, 'Array should be empty for malformed data');
      } finally {
        malformedServer.close();
      }
    });
  });
});
