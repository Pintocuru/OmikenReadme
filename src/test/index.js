// src/obsidianScripts/expandEmbeds/index.js

const { getContext } = require("./contextUtils");
const {
  removeExpandTag,
  processTemplaterTags,
} = require("./templaterProcessor");
const { expandEmbeds } = require("./embedExpander");
const { createReadme } = require("./fileManager");

/**
 * Obsidian埋め込みを展開してREADME.mdを生成
 * @param {Object} tp - Templaterオブジェクト
 * @returns {Promise<string>} 結果メッセージまたはエラー
 */
module.exports = async (tp) => {
  try {
    // 1. コンテキストを取得
    const context = await getContext(tp);
    if (!context) {
      return "/* expandEmbeds: Invalid input */";
    }

    console.log(`Content length: ${context.content.length}`);

    // 2. expandEmbedsタグを除去
    const withoutTag = removeExpandTag(context.content);
    console.log(`After tag removal: ${withoutTag.length}`);

    // 3. 埋め込みを展開（Templaterタグも同時に処理）
    const expanded = await expandEmbeds(
      withoutTag,
      context.path,
      context.vault,
      0,
      context.tp,
    );
    console.log(`After expansion: ${expanded.length}`);

    // 4. 最終的なTemplaterタグ処理（念のため）
    const finalProcessed = await processTemplaterTags(expanded, context.tp);
    console.log(`After final Templater processing: ${finalProcessed.length}`);

    // 5. README作成
    if (context.vault && context.app) {
      const result = await createReadme(
        finalProcessed,
        context.vault,
        context.app,
      );
      console.log("Process completed:", result);

      // 完了通知
      new Notice("✅ README.md の生成が完了しました!", 3000);
      return "";
    } else {
      console.warn("Vault or app not available");
      return finalProcessed;
    }
  } catch (error) {
    console.error("Error in expandEmbeds:", error);
    return `/* Error: ${error.message} */`;
  }
};
