/**
 * lib/processor.js - Content cleaning and filename generation module
 * Implements content cleaning and filename generation per constitution.md requirements
 *
 * Architecture:
 * - cleanContent: Main orchestrator following single responsibility principle
 * - Helper functions: Each handles one specific cleaning concern
 */

// ============================================================================
// CONSTANTS - HTML Entity Mapping Configuration
// ============================================================================

/**
 * HTML entity to character mapping
 * Ordered to avoid double-encoding issues (&amp; must be processed last)
 * Includes malformed variants (entities without trailing semicolon)
 */
const HTML_ENTITY_PATTERNS = [
  { pattern: /&#39;?/g, replacement: "'" },   // Numeric entity: &#39; or &#39
  { pattern: /&#x27;?/g, replacement: "'" },  // Hex entity: &#x27; or &#x27
  { pattern: /&apos;?/g, replacement: "'" },  // Named entity: &apos; or &apos
  { pattern: /&quot;/g, replacement: '"' },   // Named entity: &quot;
  { pattern: /&lt;/g, replacement: '<' },     // Named entity: &lt;
  { pattern: /&gt;/g, replacement: '>' },     // Named entity: &gt;
  { pattern: /&amp;/g, replacement: '&' },    // Named entity: &amp; (MUST be last)
];

// ============================================================================
// HELPER FUNCTIONS - Private internal utilities
// ============================================================================

/**
 * Unescape HTML entities in text
 * Uses configured mapping patterns to handle both standard and malformed entities
 *
 * @param {string} text - Text containing HTML entities
 * @returns {string} - Text with HTML entities unescaped
 */
function unescapeHtmlEntities(text) {
  let result = text;

  for (const { pattern, replacement } of HTML_ENTITY_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Compress consecutive newline characters
 * Reduces 3 or more consecutive newlines to exactly 2 newlines
 *
 * @param {string} text - Text with potential excessive newlines
 * @returns {string} - Text with compressed newlines
 */
function compressExcessiveNewlines(text) {
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * Normalize whitespace around newlines
 * Removes spaces and tabs adjacent to newline characters
 *
 * @param {string} text - Text with whitespace around newlines
 * @returns {string} - Text with cleaned newline boundaries
 */
function normalizeWhitespaceAroundNewlines(text) {
  // Remove spaces/tabs before each newline
  let result = text.replace(/[ \t]+\n/g, '\n');

  // Remove spaces/tabs after each newline
  result = result.replace(/\n[ \t]+/g, '\n');

  return result;
}

/**
 * Validate input and return fallback string for invalid inputs
 * Per constitution Article II 2.2: Transparent degradation for missing content
 *
 * @param {unknown} input - Raw input value
 * @returns {string} - Validated non-empty string or fallback
 */
function getValidatedStringOrFallback(input) {
  // Handle null or undefined (explicit check per Constitution II 2.2)
  if (input === null || input === undefined) {
    return '(No Content Body)';
  }

  // Convert to string and trim
  const trimmedString = String(input).trim();

  // Handle empty string after trim
  if (trimmedString === '') {
    return '(No Content Body)';
  }

  return trimmedString;
}

// ============================================================================
// PUBLIC API - Exported functions
// ============================================================================

/**
 * Clean content: HTML entity unescaping, newline compression, whitespace normalization
 * Per constitution Article II 2.2: null/undefined/empty returns "(No Content Body)"
 * Per constitution Article II 2.1: No AI enhancement, preserve data objectivity
 *
 * Processing pipeline:
 * 1. Input validation (returns fallback for null/undefined/empty)
 * 2. HTML entity unescaping (handles malformed entities)
 * 3. Newline compression (3+ → 2)
 * 4. Whitespace normalization (remove spaces/tabs around newlines)
 *
 * @param {string|null|undefined} text - Raw text content
 * @returns {string} - Cleaned text or fallback "(No Content Body)"
 */
export function cleanContent(text) {
  // Step 1: Validate input and get fallback if needed
  const validatedString = getValidatedStringOrFallback(text);

  // If validation returned fallback, return early
  if (validatedString === '(No Content Body)') {
    return validatedString;
  }

  // Step 2: Unescape HTML entities
  let cleaned = unescapeHtmlEntities(validatedString);

  // Step 3: Compress excessive newlines
  cleaned = compressExcessiveNewlines(cleaned);

  // Step 4: Normalize whitespace around newlines
  cleaned = normalizeWhitespaceAroundNewlines(cleaned);

  return cleaned;
}

/**
 * Generate timestamped filename
 * Format: {subreddit}_YYYY-MM-DD_HHmmss.md
 *
 * @param {string} subreddit - Subreddit name (e.g., "ObsidianMD")
 * @returns {string} - Formatted filename with current timestamp
 */
export function generateFileName(subreddit) {
  const currentDate = new Date();

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  const timestamp = `${year}-${month}-${day}_${hours}${minutes}${seconds}`;

  return `${subreddit}_${timestamp}.md`;
}
