// src/obsidianScripts/expandEmbeds/contextUtils.js

/**
 * Templaterコンテキストから必要な情報を取得
 * @param {Object} tp - Templaterオブジェクト
 * @returns {Promise<Object|null>} コンテキスト情報
 */
async function getContext(tp) {
  if (!tp?.app?.workspace) return null;

  const file = tp.app.workspace.getActiveFile();
  const content = file ? await tp.app.vault.cachedRead(file) : "";

  console.log("Processing:", file?.path);

  return {
    vault: tp.app.vault,
    content,
    path: file?.path || "",
    app: tp.app,
    tp,
  };
}

module.exports = {
  getContext,
};
