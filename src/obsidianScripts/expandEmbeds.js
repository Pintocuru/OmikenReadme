// .obsidian/scripts/expandEmbeds.js
module.exports = async (tp) => {
  // === 設定 ===
  const CONFIG = {
    MAX_DEPTH: 5,
    EXT: ".md",
    OUTPUT: "README.md",
  };

  // === ユーティリティ ===
  const utils = {
    dirname: (path) => {
      if (!path) return "";
      const lastSlash = path.lastIndexOf("/");
      return lastSlash === -1 ? "" : path.slice(0, lastSlash);
    },

    resolvePath: (base, rel) => {
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
    },

    getContext: async (tp) => {
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
    },

    findFile: (vault, basePath, linkPath) => {
      const resolved =
        utils.resolvePath(utils.dirname(basePath), linkPath) + CONFIG.EXT;
      const candidates = [resolved, linkPath];

      for (const path of candidates) {
        const file = vault.getAbstractFileByPath(path);
        if (file) {
          console.log(`Found file: ${path}`);
          return file;
        }
      }
      console.warn(`File not found: ${linkPath}`);
      return null;
    },
  };

  // === プロセッサー ===
  const processors = {
    removeExpandTag: (content) => {
      const regex = /<%\*\s*await\s+tp\.user\.expandEmbeds\(tp\)\s*%>/g;
      return content.replace(regex, "").trim();
    },

    processTemplaterTags: async (content, tpObj) => {
      try {
        const dateRegex = /<%\s*tp\.date\.now\(['"]([^'"]+)['"]\)\s*%>/g;
        let result = content;

        // matchAll を使用して安全に処理
        const matches = [...content.matchAll(dateRegex)];
        for (const match of matches) {
          const date = tpObj.date.now(match[1]);
          result = result.replace(match[0], date);
          console.log(`Date tag converted: ${match[0]} → ${date}`);
        }

        return result;
      } catch (error) {
        console.warn("Error processing Templater tags:", error);
        return content;
      }
    },

    expandEmbeds: async function (content, basePath, vault, depth = 0) {
      if (depth > CONFIG.MAX_DEPTH) {
        console.warn(`Max recursion depth ${CONFIG.MAX_DEPTH} reached`);
        return content;
      }

      if (typeof content !== "string") {
        console.warn("Content is not a string");
        return "";
      }

      // matchAll を使用して安全にマッチング
      const embedRegex = /!\[\[([^\]]+)\]\]/g;
      const matches = [...content.matchAll(embedRegex)];

      if (matches.length === 0) {
        return content;
      }

      let result = "";
      let lastIndex = 0;

      if (depth === 0) {
        console.log(`Starting embed expansion, found ${matches.length} embeds`);
      }

      for (const match of matches) {
        // マッチ前のテキストを追加
        result += content.slice(lastIndex, match.index);
        lastIndex = match.index + match[0].length;

        const link = match[1].trim();
        const linkPath = link.includes(".") ? link : `${link}${CONFIG.EXT}`;

        try {
          console.log(`Processing embed: ${link}`);
          const file = utils.findFile(vault, basePath, linkPath);

          if (file?.extension === "md") {
            // 自己参照チェック
            if (file.path === basePath) {
              console.warn(`Skipping self-reference: ${file.path}`);
              result += `<!-- Self-reference skipped: ${link} -->`;
              continue;
            }

            const fileContent = await vault.cachedRead(file);
            const expanded = await this.expandEmbeds(
              fileContent,
              file.path,
              vault,
              depth + 1
            );
            result += expanded;
            continue;
          }
        } catch (error) {
          console.warn(`Error processing embed [[${linkPath}]]:`, error);
        }

        // 展開できない場合は元の記法を保持
        result += match[0];
      }

      // 残りのテキストを追加
      result += content.slice(lastIndex);
      return result;
    },
  };

  // === ファイル管理 ===
  const fileManager = {
    createReadme: async (content, vault, app) => {
      try {
        const currentFile = app.workspace.getActiveFile();
        const dir = currentFile ? utils.dirname(currentFile.path) : "";
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
    },
  };

  // === メイン処理 ===
  try {
    const context = await utils.getContext(tp);
    if (!context) {
      return "/* expandEmbeds: Invalid input */";
    }

    console.log(`Content length: ${context.content.length}`);

    // 1. expandEmbedsタグを除去
    const withoutTag = processors.removeExpandTag(context.content);
    console.log(`After tag removal: ${withoutTag.length}`);

    // 2. Templaterタグを処理
    const processed = await processors.processTemplaterTags(
      withoutTag,
      context.tp
    );
    console.log(`After Templater processing: ${processed.length}`);

    // 3. 埋め込みを展開
    const expanded = await processors.expandEmbeds(
      processed,
      context.path,
      context.vault
    );
    console.log(`After expansion: ${expanded.length}`);

    // 4. README作成
    if (context.vault && context.app) {
      const result = await fileManager.createReadme(
        expanded,
        context.vault,
        context.app
      );
      console.log("Process completed:", result);

      // 完了通知
      new Notice("✅ README.md の生成が完了しました！", 3000);
      return "";
    } else {
      console.warn("Vault or app not available");
      return expanded;
    }
  } catch (error) {
    console.error("Error in expandEmbeds:", error);
    return `/* Error: ${error.message} */`;
  }
};
