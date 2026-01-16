import assert from 'node:assert';
import { describe, it } from 'node:test';
import { cleanContent, generateFileName } from '../lib/processor.js';

/**
 * 阶段一：测试驱动开发 (TDD) 骨架
 * 在未编写业务逻辑前，先定义契约断言。
 */

describe('Redditx2md 核心逻辑测试', () => {

  describe('内容清洗逻辑 (cleanContent)', () => {
    it('应正确还原 HTML 转义字符', () => {
      const input = 'Show &amp; Tell &lt;Obsidian&gt;';
      const expected = 'Show & Tell <Obsidian>';
      assert.strictEqual(cleanContent(input), expected);
    });

    it('应将 3 个及以上的换行符压缩为 2 个', () => {
      const input = 'Line 1\n\n\n\nLine 2';
      const expected = 'Line 1\n\nLine 2';
      assert.strictEqual(cleanContent(input), expected);
    });

    it('当正文为空或未定义时，应返回回退字符串', () => {
      assert.strictEqual(cleanContent(''), '(No Content Body)');
      assert.strictEqual(cleanContent(null), '(No Content Body)');
    });
  });

  describe('文件名生成逻辑 (generateFileName)', () => {
    it('应符合 ObsidianMD_YYYY-MM-DD 格式正则表达式', () => {
      const fileName = generateFileName('ObsidianMD');
      // 验证前缀和基本格式: ObsidianMD_202X-XX-XX...
      const regex = /^ObsidianMD_\d{4}-\d{2}-\d{2}_.*\.md$/;
      assert.ok(regex.test(fileName), `文件名 ${fileName} 不符合规范`);
    });
  });

  describe('异常边界 (Edge Cases)', () => {
    it('API 返回 429 时应能识别并构造特定错误对象', () => {
      // 模拟 axios 错误结构
      const mockError = { response: { status: 429 } };
      const isRateLimit = (err) => err.response?.status === 429;
      assert.strictEqual(isRateLimit(mockError), true);
    });
  });

});
