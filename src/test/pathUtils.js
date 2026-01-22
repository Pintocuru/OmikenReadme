// src/obsidianScripts/expandEmbeds/pathUtils.js

const CONFIG = require("./config");

/**
 * パスからディレクトリ部分を取得
 * @param {string} path - ファイルパス
 * @returns {string} ディレクトリパス
 */
function dirname(path) {
  if (!path) return "";
  const lastSlash = path.lastIndexOf("/");
  return lastSlash === -1 ? "" : path.slice(0, lastSlash);
}

/**
 * 相対パスを解決
 * @param {string} base - ベースパス
 * @param {string} rel - 相対パス
 * @returns {string} 解決されたパス
 */
function resolvePath(base, rel) {
  if (!base || !rel) return rel || "";
  if (rel.startsWith("/")) return rel.slice(1);

  const result = [...base.split("/").filter(Boolean)];
  rel
    .split("/")
    .filter(Boolean)
    .forEach((part) => {
      if (part === "..") result.pop();
      else if (part !== ".") result.push(part);
    });
  return result.join("/");
}

/**
 * ファイルを検索
 * @param {Object} vault - Obsidian Vault
 * @param {string} basePath - 基準パス
 * @param {string} linkPath - 検索するリンクパス
 * @returns {Object|null} 見つかったファイル、または null
 */
function findFile(vault, basePath, linkPath) {
  console.log(`Searching for file: "${linkPath}" from base: "${basePath}"`);

  const resolved = resolvePath(dirname(basePath), linkPath);
  console.log(`Resolved path: "${resolved}"`);

  // 候補パスを作成
  const candidates = [resolved, linkPath];

  // .md拡張子が付いていない場合の候補も追加
  if (!resolved.endsWith(CONFIG.EXT)) {
    candidates.push(resolved + CONFIG.EXT);
  }
  if (!linkPath.endsWith(CONFIG.EXT)) {
    candidates.push(linkPath + CONFIG.EXT);
  }

  console.log(`Checking candidates:`, candidates);

  // 各候補を順番にチェック
  for (const path of candidates) {
    const file = vault.getAbstractFileByPath(path);
    if (file) {
      console.log(`✅ Found file: ${path}`);
      return file;
    } else {
      console.log(`❌ Not found: ${path}`);
    }
  }

  console.warn(`❌ File not found after checking all candidates: ${linkPath}`);
  return null;
}

module.exports = {
  dirname,
  resolvePath,
  findFile,
};
