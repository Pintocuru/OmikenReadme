// src/obsidianScripts/expandEmbeds/fileManager.js

const CONFIG = require("./config");
const { dirname } = require("./pathUtils");

/**
 * README.mdを作成
 * @param {string} content - 書き込むコンテンツ
 * @param {Object} vault - Obsidian Vault
 * @param {Object} app - Obsidian App
 * @returns {Promise<string>} 結果メッセージ
 */
async function createReadme(content, vault, app) {
  try {
    const currentFile = app.workspace.getActiveFile();
    const dir = currentFile ? dirname(currentFile.path) : "";
    const path = dir ? `${dir}/${CONFIG.OUTPUT}` : CONFIG.OUTPUT;

    // 既存ファイルを削除
    const existing = vault.getAbstractFileByPath(path);
    if (existing) {
      console.log(`Deleting existing ${CONFIG.OUTPUT}: ${path}`);
      await vault.delete(existing);
    }

    // 新規作成
    console.log(`Creating new ${CONFIG.OUTPUT}: ${path}`);
    await vault.create(path, content);

    return `Successfully created ${CONFIG.OUTPUT} at ${path}`;
  } catch (error) {
    console.error(`Error creating ${CONFIG.OUTPUT}:`, error);
    throw error;
  }
}

module.exports = {
  createReadme,
};
