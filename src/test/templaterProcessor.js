// src/obsidianScripts/expandEmbeds/templaterProcessor.js

/**
 * expandEmbedsタグを除去
 * @param {string} content - コンテンツ
 * @returns {string} タグ除去後のコンテンツ
 */
function removeExpandTag(content) {
  const regex = /<%\*\s*await\s+tp\.user\.expandEmbeds\(tp\)\s*%>/g;
  return content.replace(regex, "").trim();
}

/**
 * Templaterタグを処理（日付フォーマット等）
 * @param {string} content - コンテンツ
 * @param {Object} tpObj - Templaterオブジェクト
 * @returns {Promise<string>} 処理後のコンテンツ
 */
async function processTemplaterTags(content, tpObj) {
  try {
    console.log("Processing Templater tags...");

    // 日付フォーマットのパターン
    const patterns = [
      /<%\s*tp\.date\.now\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*%>/g,
      /<%\s*tp\.date\.now\s*\(\s*'([^']+)'\s*\)\s*%>/g,
      /<%\s*tp\.date\.now\s*\(\s*"([^"]+)"\s*\)\s*%>/g,
    ];

    let result = content;
    let totalReplacements = 0;

    for (const regex of patterns) {
      const matches = [...result.matchAll(regex)];
      console.log(
        `Found ${matches.length} matches for pattern: ${regex.source}`,
      );

      for (const match of matches) {
        try {
          const format = match[1];
          const date = tpObj.date.now(format);
          const oldText = match[0];
          result = result.replace(oldText, date);
          totalReplacements++;
          console.log(`Templater tag converted: ${oldText} → ${date}`);
        } catch (dateError) {
          console.warn(
            `Error processing date format "${match[1]}":`,
            dateError,
          );
          const errorComment = `<!-- Error processing date: ${match[1]} -->`;
          result = result.replace(match[0], errorComment);
        }
      }
    }

    console.log(`Total Templater replacements: ${totalReplacements}`);
    return result;
  } catch (error) {
    console.warn("Error processing Templater tags:", error);
    return content;
  }
}

module.exports = {
  removeExpandTag,
  processTemplaterTags,
};
