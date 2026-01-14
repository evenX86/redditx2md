/**
 * processor.js - 内容清洗和文件名生成模块
 */

/**
 * 还原 HTML 转义字符
 * @param {string} text - 包含 HTML 实体的文本
 * @returns {string} - 还原后的文本
 */
function unescapeHtml(text) {
  if (!text) return '';
  const htmlEntities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&apos;': "'"
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => htmlEntities[entity] || entity);
}

/**
 * 清洗内容：HTML 转义还原、压缩空行、trim
 * @param {string} text - 原始文本
 * @returns {string} - 清洗后的文本
 */
export function cleanContent(text) {
  // 容错处理：null/undefined/空字符串
  if (text === null || text === undefined || text === '') {
    return '(No Content Body)';
  }

  let result = text;

  // 还原 HTML 转义字符
  result = unescapeHtml(result);

  // 压缩 3 个及以上的连续换行符为 2 个
  result = result.replace(/\n{3,}/g, '\n\n');

  // Trim 首尾空白
  result = result.trim();

  return result;
}

/**
 * 生成文件名
 * @param {string} subreddit - 子版块名称
 * @returns {string} - 格式化的文件名: ObsidianMD_YYYY-MM-DD_HHmmss.md
 */
export function generateFileName(subreddit) {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${subreddit}_${year}-${month}-${day}_${hours}${minutes}${seconds}.md`;
}
