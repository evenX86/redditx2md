/**
 * tests/processor.test.js - processor.js 单元测试套件
 * TDD Phase: Complete test assertions before implementation
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { cleanContent, generateFileName } from '../lib/processor.js';

describe('processor.js - Content Cleaning & Filename Generation', () => {

  describe('cleanContent() - HTML Entity Unescaping', () => {

    it('应还原 &amp; → &', () => {
      const input = 'Show &amp; Tell';
      const expected = 'Show & Tell';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: &amp; should be converted to &');
    });

    it('应还原 &lt; → <', () => {
      const input = 'Tag &lt;div&gt;';
      const expected = 'Tag <div>';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: &lt; should be converted to <');
    });

    it('应还原 &gt; → >', () => {
      const input = '5 &gt; 3';
      const expected = '5 > 3';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: &gt; should be converted to >');
    });

    it('应还原 &quot; → "', () => {
      const input = '&quot;Hello&quot;';
      const expected = '"Hello"';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: &quot; should be converted to "');
    });

    it('应还原 &#39; → \'', () => {
      const input = 'It&#39;s mine';
      const expected = "It's mine";
      assert.strictEqual(cleanContent(input), expected,
        'Failed: &#39; should be converted to \'');
    });

    it('应还原 &#x27; → \'', () => {
      const input = 'It&#x27;s yours';
      const expected = "It's yours";
      assert.strictEqual(cleanContent(input), expected,
        'Failed: &#x27; should be converted to \'');
    });

    it('应还原 &apos; → \'', () => {
      const input = 'It&aposs ours';
      const expected = "It's ours";
      assert.strictEqual(cleanContent(input), expected,
        'Failed: &apos; should be converted to \'');
    });

    it('应处理混合 HTML 实体', () => {
      const input = 'Show &amp; Tell &lt;Obsidian&gt; &quot;v1.0&quot;';
      const expected = 'Show & Tell <Obsidian> "v1.0"';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: Mixed HTML entities should all be unescaped');
    });

    it('应保持未知实体不变', () => {
      const input = 'Hello &unknown; World';
      const expected = 'Hello &unknown; World';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: Unknown entities should remain unchanged');
    });
  });

  describe('cleanContent() - Newline Compression', () => {

    it('应将 3 个连续换行符压缩为 2 个', () => {
      const input = 'Line 1\n\n\nLine 2';
      const expected = 'Line 1\n\nLine 2';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: \\n\\n\\n should be compressed to \\n\\n');
    });

    it('应将 4 个连续换行符压缩为 2 个', () => {
      const input = 'Line 1\n\n\n\nLine 2';
      const expected = 'Line 1\n\nLine 2';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: \\n\\n\\n\\n should be compressed to \\n\\n');
    });

    it('应将 5 个及以上连续换行符压缩为 2 个', () => {
      const input = 'Line 1\n\n\n\n\n\nLine 2';
      const expected = 'Line 1\n\nLine 2';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: 5+ newlines should be compressed to \\n\\n');
    });

    it('应保持 2 个换行符不变', () => {
      const input = 'Line 1\n\nLine 2';
      const expected = 'Line 1\n\nLine 2';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: \\n\\n should remain unchanged');
    });

    it('应保持 1 个换行符不变', () => {
      const input = 'Line 1\nLine 2';
      const expected = 'Line 1\nLine 2';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: Single newline should remain unchanged');
    });

    it('应处理多处换行符压缩', () => {
      const input = 'Line 1\n\n\n\nLine 2\n\n\n\n\nLine 3';
      const expected = 'Line 1\n\nLine 2\n\nLine 3';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: Multiple newline groups should all be compressed');
    });
  });

  describe('cleanContent() - Whitespace Trimming', () => {

    it('应移除首尾空格', () => {
      const input = '   Title   ';
      const expected = 'Title';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: Leading and trailing spaces should be trimmed');
    });

    it('应移除首尾制表符', () => {
      const input = '\t\tTitle\t\t';
      const expected = 'Title';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: Leading and trailing tabs should be trimmed');
    });

    it('应移除首尾混合空白字符', () => {
      const input = '  \n\t  Title  \t\n  ';
      const expected = 'Title';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: Mixed leading/trailing whitespace should be trimmed');
    });
  });

  describe('cleanContent() - Edge Cases (Constitution Article II 2.2)', () => {

    it('null 应返回 "(No Content Body)"', () => {
      const result = cleanContent(null);
      assert.strictEqual(result, '(No Content Body)',
        'Failed: null should return fallback string "(No Content Body)"');
    });

    it('undefined 应返回 "(No Content Body)"', () => {
      const result = cleanContent(undefined);
      assert.strictEqual(result, '(No Content Body)',
        'Failed: undefined should return fallback string "(No Content Body)"');
    });

    it('空字符串应返回 "(No Content Body)"', () => {
      const result = cleanContent('');
      assert.strictEqual(result, '(No Content Body)',
        'Failed: Empty string should return fallback string "(No Content Body)"');
    });

    it('仅空白字符串应返回 "(No Content Body)" after trim', () => {
      const input = '   \n\n\t   ';
      const expected = '(No Content Body)';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: Whitespace-only string should return fallback after trim becomes empty');
    });
  });

  describe('cleanContent() - Combined Operations', () => {

    it('应正确处理 HTML 实体 + 换行压缩 + trim 组合场景', () => {
      const input = '  \n  Show &amp; Tell  \n\n\n\n  Obsidian &gt; Others  \n  ';
      const expected = 'Show & Tell\n\nObsidian > Others';
      assert.strictEqual(cleanContent(input), expected,
        'Failed: Combined operations should work correctly');
    });
  });

  describe('generateFileName() - Filename Format', () => {

    it('应返回 {subreddit}_YYYY-MM-DD_HHmmss.md 格式', () => {
      const fileName = generateFileName('ObsidianMD');
      const regex = /^ObsidianMD_\d{4}-\d{2}-\d{2}_\d{6}\.md$/;
      assert.ok(regex.test(fileName),
        `Failed: Filename "${fileName}" does not match format {subreddit}_YYYY-MM-DD_HHmmss.md`);
    });

    it('年份应为 4 位数字', () => {
      const fileName = generateFileName('TestSub');
      const yearMatch = fileName.match(/\d{4}/);
      assert.ok(yearMatch, 'Failed: Year should be 4 digits');
      const year = parseInt(yearMatch[0], 10);
      assert.ok(year >= 2024 && year <= 2100,
        `Failed: Year ${year} is out of valid range`);
    });

    it('月份应为 2 位数字 (01-12)', () => {
      const fileName = generateFileName('TestSub');
      const monthMatch = fileName.match(/-(\d{2})-/);
      assert.ok(monthMatch, 'Failed: Month should be 2 digits');
      const month = parseInt(monthMatch[1], 10);
      assert.ok(month >= 1 && month <= 12,
        `Failed: Month ${month} is out of valid range 01-12`);
    });

    it('日期应为 2 位数字 (01-31)', () => {
      const fileName = generateFileName('TestSub');
      const dayMatch = fileName.match(/-(\d{2})_/);
      assert.ok(dayMatch, 'Failed: Day should be 2 digits');
      const day = parseInt(dayMatch[1], 10);
      assert.ok(day >= 1 && day <= 31,
        `Failed: Day ${day} is out of valid range 01-31`);
    });

    it('时分秒应为 6 位数字 (HHmmss)', () => {
      const fileName = generateFileName('TestSub');
      const timeMatch = fileName.match(/_(\d{6})\.md$/);
      assert.ok(timeMatch, 'Failed: Time should be 6 digits (HHmmss)');
    });

    it('小时应为 00-23', () => {
      const fileName = generateFileName('TestSub');
      const hourMatch = fileName.match(/_(\d{2})\d{4}\.md$/);
      assert.ok(hourMatch, 'Failed: Hour should be 2 digits');
      const hour = parseInt(hourMatch[1], 10);
      assert.ok(hour >= 0 && hour <= 23,
        `Failed: Hour ${hour} is out of valid range 00-23`);
    });

    it('分钟应为 00-59', () => {
      const fileName = generateFileName('TestSub');
      const minuteMatch = fileName.match(/_\d{2}(\d{2})\d{2}\.md$/);
      assert.ok(minuteMatch, 'Failed: Minute should be 2 digits');
      const minute = parseInt(minuteMatch[1], 10);
      assert.ok(minute >= 0 && minute <= 59,
        `Failed: Minute ${minute} is out of valid range 00-59`);
    });

    it('秒数应为 00-59', () => {
      const fileName = generateFileName('TestSub');
      const secondMatch = fileName.match(/_\d{4}(\d{2})\.md$/);
      assert.ok(secondMatch, 'Failed: Second should be 2 digits');
      const second = parseInt(secondMatch[1], 10);
      assert.ok(second >= 0 && second <= 59,
        `Failed: Second ${second} is out of valid range 00-59`);
    });

    it('应使用传入的 subreddit 名称作为前缀', () => {
      const fileName = generateFileName('MySubreddit');
      assert.ok(fileName.startsWith('MySubreddit_'),
        `Failed: Filename should start with "MySubreddit_", got "${fileName}"`);
    });

    it('应以 .md 扩展名结尾', () => {
      const fileName = generateFileName('TestSub');
      assert.ok(fileName.endsWith('.md'),
        `Failed: Filename should end with .md, got "${fileName}"`);
    });
  });
});
