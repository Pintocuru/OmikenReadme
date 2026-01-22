// src/obsidianScripts/expandEmbeds/embedExpander.js

const CONFIG = require("./config");
const { findFile } = require("./pathUtils");
const { processTemplaterTags } = require("./templaterProcessor");

/**
 * 埋め込みを再帰的に展開
 * @param {string} content - コンテンツ
 * @param {string} basePath - ベースパス
 * @param {Object} vault - Obsidian Vault
 * @param {number} depth - 再帰深度
 * @param {Object} tpObj - Templaterオブジェクト
 * @returns {Promise<string>} 展開後のコンテンツ
 */
async function expandEmbeds(content, basePath, vault, depth = 0, tpObj = null) {
  // 最大深度チェック
  if (depth > CONFIG.MAX_DEPTH) {
    console.warn(`Max recursion depth ${CONFIG.MAX_DEPTH} reached`);
    return content;
  }

  if (typeof content !== "string") {
    console.warn("Content is not a string");
    return "";
  }

  // 埋め込み記法を検出: ![[link]] または ![title](path) または ![](path)
  const embedRegex = /(?:!\[\[([^\]]+)\]\]|!\[([^\]]*)\]\(([^)]+)\))/g;
  const matches = [...content.matchAll(embedRegex)];

  // 埋め込みがない場合
  if (matches.length === 0) {
    if (tpObj && depth > 0) {
      return await processTemplaterTags(content, tpObj);
    }
    return content;
  }

  let result = "";
  let lastIndex = 0;

  if (depth === 0) {
    console.log(`Starting embed expansion, found ${matches.length} embeds`);
  }

  // 各埋め込みを処理
  for (const match of matches) {
    // マッチ前のテキストを追加
    result += content.slice(lastIndex, match.index);
    lastIndex = match.index + match[0].length;

    const { linkPath, embedType } = parseLinkPath(match);

    if (!linkPath) {
      result += match[0];
      continue;
    }

    try {
      console.log(`Processing ${embedType} embed: ${linkPath}`);
      const file = findFile(vault, basePath, linkPath);

      if (file?.extension === "md") {
        // 自己参照チェック
        if (file.path === basePath) {
          console.warn(`Skipping self-reference: ${file.path}`);
          result += `<!-- Self-reference skipped: ${linkPath} -->`;
          continue;
        }

        // ファイル内容を読み込み
        const fileContent = await vault.cachedRead(file);

        // 再帰的に埋め込みを展開
        const expanded = await expandEmbeds(
          fileContent,
          file.path,
          vault,
          depth + 1,
          tpObj,
        );

        // Templaterタグを処理
        const processedExpanded = tpObj
          ? await processTemplaterTags(expanded, tpObj)
          : expanded;

        result += processedExpanded;
        continue;
      }
    } catch (error) {
      console.warn(
        `Error processing ${embedType} embed [[${linkPath}]]:`,
        error,
      );
    }

    // 展開できない場合は元の記法を保持
    result += match[0];
  }

  // 残りのテキストを追加
  result += content.slice(lastIndex);

  // 最終的な結果のTemplaterタグを処理
  if (tpObj) {
    result = await processTemplaterTags(result, tpObj);
  }

  return result;
}

/**
 * マッチ結果からリンクパスを解析
 * @param {Array} match - 正規表現のマッチ結果
 * @returns {Object} { linkPath, embedType }
 */
function parseLinkPath(match) {
  let linkPath;
  let embedType;

  if (match[1]) {
    // ![[link]] 形式
    const link = match[1].trim();
    linkPath = link.includes(".") ? link : `${link}${CONFIG.EXT}`;
    embedType = "wikilink";
  } else if (match[3]) {
    // ![title](path) または ![](path) 形式
    linkPath = match[3].trim();
    if (!linkPath.includes(".")) {
      linkPath += CONFIG.EXT;
    }
    embedType = "markdown";
  }

  return { linkPath, embedType };
}

module.exports = {
  expandEmbeds,
};
