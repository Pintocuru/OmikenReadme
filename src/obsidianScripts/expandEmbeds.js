// .obsidian/scripts/expandEmbeds.js
module.exports = async (tp) => {
  // 設定
  const CONFIG = {
    MAX_DEPTH: 5,
    EXT: ".md",
    OUTPUT: "README.md",
  };

  // ユーティリティ
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
      console.log(`Searching for file: "${linkPath}" from base: "${basePath}"`);

      // 既に .md で終わっている場合はそのまま使用
      let resolved = utils.resolvePath(utils.dirname(basePath), linkPath);
      console.log(`Resolved path: "${resolved}"`);

      // 候補パスを作成
      const candidates = [
        resolved, // 解決されたパス
        linkPath, // 元のパス
      ];

      // .mdが付いていない場合の候補も追加
      if (!resolved.endsWith(CONFIG.EXT)) {
        candidates.push(resolved + CONFIG.EXT);
      }
      if (!linkPath.endsWith(CONFIG.EXT)) {
        candidates.push(linkPath + CONFIG.EXT);
      }

      console.log(`Checking candidates:`, candidates);

      for (const path of candidates) {
        const file = vault.getAbstractFileByPath(path);
        if (file) {
          console.log(`✅ Found file: ${path}`);
          return file;
        } else {
          console.log(`❌ Not found: ${path}`);
        }
      }

      console.warn(
        `❌ File not found after checking all candidates: ${linkPath}`
      );
      return null;
    },
  };

  // プロセッサー
  const processors = {
    removeExpandTag: (content) => {
      const regex = /<%\*\s*await\s+tp\.user\.expandEmbeds\(tp\)\s*%>/g;
      return content.replace(regex, "").trim();
    },

    // 改善されたTemplaterタグ処理
    processTemplaterTags: async (content, tpObj) => {
      try {
        console.log("Processing Templater tags...");

        // より包括的な正規表現（タブやスペースの違いに対応）
        const patterns = [
          // tp.date.now("format") パターン
          /<%\s*tp\.date\.now\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*%>/g,
          // tp.date.now('format') パターン（シングルクォート）
          /<%\s*tp\.date\.now\s*\(\s*'([^']+)'\s*\)\s*%>/g,
          // tp.date.now("format") パターン（ダブルクォート）
          /<%\s*tp\.date\.now\s*\(\s*"([^"]+)"\s*\)\s*%>/g,
        ];

        let result = content;
        let totalReplacements = 0;

        for (const regex of patterns) {
          const matches = [...result.matchAll(regex)];
          console.log(
            `Found ${matches.length} matches for pattern: ${regex.source}`
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
                dateError
              );
              // エラーの場合、元のテキストを保持するのではなく、エラー情報を含める
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
    },

    expandEmbeds: async function (
      content,
      basePath,
      vault,
      depth = 0,
      tpObj = null
    ) {
      if (depth > CONFIG.MAX_DEPTH) {
        console.warn(`Max recursion depth ${CONFIG.MAX_DEPTH} reached`);
        return content;
      }

      if (typeof content !== "string") {
        console.warn("Content is not a string");
        return "";
      }

      // 両方の記法にマッチする統合正規表現
      // ![[link]] または ![title](path) または ![](path)
      const embedRegex = /(?:!\[\[([^\]]+)\]\]|!\[([^\]]*)\]\(([^)]+)\))/g;
      const matches = [...content.matchAll(embedRegex)];

      if (matches.length === 0) {
        // 埋め込みがない場合でも、Templaterタグを処理
        if (tpObj && depth > 0) {
          return await this.processTemplaterTags(content, tpObj);
        }
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
          // 拡張子がない場合は .md を追加
          if (!linkPath.includes(".")) {
            linkPath += CONFIG.EXT;
          }
          embedType = "markdown";
        }

        if (!linkPath) {
          result += match[0];
          continue;
        }

        try {
          console.log(`Processing ${embedType} embed: ${linkPath}`);
          const file = utils.findFile(vault, basePath, linkPath);

          if (file?.extension === "md") {
            // 自己参照チェック
            if (file.path === basePath) {
              console.warn(`Skipping self-reference: ${file.path}`);
              result += `<!-- Self-reference skipped: ${linkPath} -->`;
              continue;
            }

            const fileContent = await vault.cachedRead(file);

            // 再帰的に埋め込みを展開し、同時にTemplaterタグも処理
            const expanded = await this.expandEmbeds(
              fileContent,
              file.path,
              vault,
              depth + 1,
              tpObj
            );

            // 埋め込まれたコンテンツのTemplaterタグを処理
            const processedExpanded = tpObj
              ? await this.processTemplaterTags(expanded, tpObj)
              : expanded;

            result += processedExpanded;
            continue;
          }
        } catch (error) {
          console.warn(
            `Error processing ${embedType} embed [[${linkPath}]]:`,
            error
          );
        }

        // 展開できない場合は元の記法を保持
        result += match[0];
      }

      // 残りのテキストを追加
      result += content.slice(lastIndex);

      // 最終的な結果のTemplaterタグを処理
      if (tpObj) {
        result = await this.processTemplaterTags(result, tpObj);
      }

      return result;
    },
  };

  // ファイル管理
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

  // メイン処理
  try {
    const context = await utils.getContext(tp);
    if (!context) {
      return "/* expandEmbeds: Invalid input */";
    }

    console.log(`Content length: ${context.content.length}`);

    // 1. expandEmbedsタグを除去
    const withoutTag = processors.removeExpandTag(context.content);
    console.log(`After tag removal: ${withoutTag.length}`);

    // 2. 埋め込みを展開（Templaterタグも同時に処理）
    const expanded = await processors.expandEmbeds(
      withoutTag,
      context.path,
      context.vault,
      0,
      context.tp // tpオブジェクトを渡す
    );
    console.log(`After expansion: ${expanded.length}`);

    // 3. 最終的なTemplaterタグ処理（念のため）
    const finalProcessed = await processors.processTemplaterTags(
      expanded,
      context.tp
    );
    console.log(`After final Templater processing: ${finalProcessed.length}`);

    // 4. README作成
    if (context.vault && context.app) {
      const result = await fileManager.createReadme(
        finalProcessed,
        context.vault,
        context.app
      );
      console.log("Process completed:", result);

      // 完了通知
      new Notice("✅ README.md の生成が完了しました！", 3000);
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
