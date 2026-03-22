// src/obsidianScripts/expandEmbeds.js
// 単一ファイル版（可読性を保ちつつ分割を諦める）

module.exports = async (tp, lang = "en") => {
  // ==================== 設定 ====================
  const CONFIG = {
    MAX_DEPTH: 5,
    EXT: ".md",
    OUTPUT: lang === "en" ? "README.md" : `README.${lang}.md`,
    // 画像ファイルの拡張子（埋め込み展開をスキップ）
    IMAGE_EXTENSIONS: [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".webp",
      ".bmp",
      ".ico",
    ],
  };

  // ==================== パスユーティリティ ====================
  const PathUtils = {
    /**
     * パスからディレクトリ部分を取得
     */
    dirname(path) {
      if (!path) return "";
      const lastSlash = path.lastIndexOf("/");
      return lastSlash === -1 ? "" : path.slice(0, lastSlash);
    },

    /**
     * 相対パスを解決
     */
    resolvePath(base, rel) {
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

    /**
     * パスが画像ファイルかどうかを判定
     */
    isImageFile(path) {
      if (!path) return false;
      const lowerPath = path.toLowerCase();
      return CONFIG.IMAGE_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
    },

    /**
     * ファイルを検索（デバッグモード対応）
     */
    findFile(vault, basePath, linkPath, debugMode = false) {
      if (debugMode) {
        console.log(
          `Searching for file: "${linkPath}" from base: "${basePath}"`,
        );
      }

      const resolved = this.resolvePath(this.dirname(basePath), linkPath);

      if (debugMode) {
        console.log(`Resolved path: "${resolved}"`);
      }

      // 候補パスを作成
      const candidates = [resolved, linkPath];

      if (!resolved.endsWith(CONFIG.EXT)) {
        candidates.push(resolved + CONFIG.EXT);
      }
      if (!linkPath.endsWith(CONFIG.EXT)) {
        candidates.push(linkPath + CONFIG.EXT);
      }

      if (debugMode) {
        console.log(`Checking candidates:`, candidates);
      }

      for (const path of candidates) {
        const file = vault.getAbstractFileByPath(path);
        if (file) {
          if (debugMode) {
            console.log(`✅ Found file: ${path}`);
          }
          return file;
        }
      }

      if (debugMode) {
        console.warn(`❌ File not found: ${linkPath}`);
      }
      return null;
    },
  };

  // ==================== コンテキストユーティリティ ====================
  const ContextUtils = {
    /**
     * Templaterコンテキストから必要な情報を取得
     */
    async getContext(tp) {
      if (!tp?.app?.workspace) return null;

      const file = tp.app.workspace.getActiveFile();
      const content = file ? await tp.app.vault.cachedRead(file) : "";

      return {
        vault: tp.app.vault,
        content,
        path: file?.path || "",
        app: tp.app,
        tp,
      };
    },
  };

  // ==================== Templaterプロセッサー ====================
  const TemplaterProcessor = {
    /**
     * expandEmbedsタグを除去
     */
    removeExpandTag(content) {
      const regex = /<%\*\s*await\s+tp\.user\.expandEmbeds\(tp\)\s*%>/g;
      return content.replace(regex, "").trim();
    },

    /**
     * Templaterタグを処理（日付フォーマット等）
     */
    async processTemplaterTags(content, tpObj) {
      try {
        console.log("Processing Templater tags...");

        const patterns = [
          /<%\s*tp\.date\.now\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*%>/g,
          /<%\s*tp\.date\.now\s*\(\s*'([^']+)'\s*\)\s*%>/g,
          /<%\s*tp\.date\.now\s*\(\s*"([^"]+)"\s*\)\s*%>/g,
        ];

        let result = content;
        let totalReplacements = 0;

        for (const regex of patterns) {
          const matches = [...result.matchAll(regex)];
          console.log(`Found ${matches.length} matches`);

          for (const match of matches) {
            try {
              const format = match[1];
              const date = tpObj.date.now(format);
              const oldText = match[0];
              result = result.replace(oldText, date);
              totalReplacements++;
              console.log(`Converted: ${oldText} → ${date}`);
            } catch (dateError) {
              console.warn(`Error processing date "${match[1]}":`, dateError);
              const errorComment = `<!-- Error processing date: ${match[1]} -->`;
              result = result.replace(match[0], errorComment);
            }
          }
        }

        console.log(`Total replacements: ${totalReplacements}`);
        return result;
      } catch (error) {
        console.warn("Error processing Templater tags:", error);
        return content;
      }
    },
  };

  // ==================== 埋め込み展開 ====================
  const EmbedExpander = {
    // 統計情報
    stats: {
      totalEmbeds: 0,
      successfulExpansions: 0,
      failedExpansions: 0,
      skippedImages: 0,
      failedFiles: [],

      reset() {
        this.totalEmbeds = 0;
        this.successfulExpansions = 0;
        this.failedExpansions = 0;
        this.skippedImages = 0;
        this.failedFiles = [];
      },

      addFailure(linkPath, reason) {
        this.failedExpansions++;
        this.failedFiles.push({ path: linkPath, reason });
      },

      addSuccess() {
        this.successfulExpansions++;
      },

      addSkippedImage() {
        this.skippedImages++;
      },
    },

    /**
     * マッチ結果からリンクパスを解析
     */
    parseLinkPath(match) {
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
    },

    /**
     * 埋め込みを再帰的に展開
     */
    async expandEmbeds(content, basePath, vault, depth = 0, tpObj = null) {
      // 最大深度チェック
      if (depth > CONFIG.MAX_DEPTH) {
        console.warn(`Max recursion depth ${CONFIG.MAX_DEPTH} reached`);
        return content;
      }

      if (typeof content !== "string") {
        console.warn("Content is not a string");
        return "";
      }

      // 埋め込み記法を検出
      const embedRegex = /(?:!\[\[([^\]]+)\]\]|!\[([^\]]*)\]\(([^)]+)\))/g;
      const matches = [...content.matchAll(embedRegex)];

      // 埋め込みがない場合
      if (matches.length === 0) {
        if (tpObj && depth > 0) {
          return await TemplaterProcessor.processTemplaterTags(content, tpObj);
        }
        return content;
      }

      let result = "";
      let lastIndex = 0;

      if (depth === 0) {
        this.stats.totalEmbeds = matches.length;
        console.log(`Found ${matches.length} embeds`);
      }

      // 各埋め込みを処理
      for (const match of matches) {
        result += content.slice(lastIndex, match.index);
        lastIndex = match.index + match[0].length;

        const { linkPath, embedType } = this.parseLinkPath(match);

        if (!linkPath) {
          result += match[0];
          continue;
        }

        // 画像ファイルの場合はスキップ（元の記法を保持）
        if (PathUtils.isImageFile(linkPath)) {
          if (depth === 0) {
            this.stats.addSkippedImage();
          }
          result += match[0];
          continue;
        }

        try {
          const file = PathUtils.findFile(vault, basePath, linkPath, false);

          if (file?.extension === "md") {
            // 自己参照チェック
            if (file.path === basePath) {
              if (depth === 0) {
                this.stats.addFailure(linkPath, "自己参照");
              }
              result += `<!-- Self-reference skipped: ${linkPath} -->`;
              continue;
            }

            // ファイル内容を読み込み
            const fileContent = await vault.cachedRead(file);

            // 再帰的に埋め込みを展開
            const expanded = await this.expandEmbeds(
              fileContent,
              file.path,
              vault,
              depth + 1,
              tpObj,
            );

            // Templaterタグを処理
            const processed = tpObj
              ? await TemplaterProcessor.processTemplaterTags(expanded, tpObj)
              : expanded;

            if (depth === 0) {
              this.stats.addSuccess();
            }
            result += processed;
            continue;
          } else if (file) {
            // .md以外のファイル
            if (depth === 0) {
              this.stats.addFailure(linkPath, "非MDファイル");
            }
          } else {
            // ファイルが見つからない
            if (depth === 0) {
              this.stats.addFailure(linkPath, "ファイル未検出");
            }
          }
        } catch (error) {
          if (depth === 0) {
            this.stats.addFailure(linkPath, error.message);
          }
          console.warn(`Error processing embed [[${linkPath}]]:`, error);
        }

        // 展開できない場合は元の記法を保持
        result += match[0];
      }

      // 残りのテキストを追加
      result += content.slice(lastIndex);

      // 最終的な結果のTemplaterタグを処理
      if (tpObj) {
        result = await TemplaterProcessor.processTemplaterTags(result, tpObj);
      }

      return result;
    },
  };

  // ==================== ファイルマネージャー ====================
  const FileManager = {
    /**
     * README.mdを作成
     */
    async createReadme(content, vault, app) {
      try {
        const currentFile = app.workspace.getActiveFile();
        const dir = currentFile ? PathUtils.dirname(currentFile.path) : "";
        const path = dir ? `${dir}/${CONFIG.OUTPUT}` : CONFIG.OUTPUT;

        // 既存ファイルを削除
        const existing = vault.getAbstractFileByPath(path);
        if (existing) {
          await vault.delete(existing);
        }

        // 新規作成
        await vault.create(path, content);

        return path;
      } catch (error) {
        console.error(`Error creating ${CONFIG.OUTPUT}:`, error);
        throw error;
      }
    },
  };

  // ==================== メイン処理 ====================
  try {
    // 統計情報をリセット
    EmbedExpander.stats.reset();

    // 1. コンテキストを取得
    const context = await ContextUtils.getContext(tp);
    if (!context) {
      return "/* expandEmbeds: Invalid input */";
    }

    // 2. expandEmbedsタグを除去
    const withoutTag = TemplaterProcessor.removeExpandTag(context.content);

    // 3. 埋め込みを展開
    const expanded = await EmbedExpander.expandEmbeds(
      withoutTag,
      context.path,
      context.vault,
      0,
      context.tp,
    );

    // 4. 最終的なTemplaterタグ処理
    const finalProcessed = await TemplaterProcessor.processTemplaterTags(
      expanded,
      context.tp,
    );

    // 5. README作成
    if (context.vault && context.app) {
      const outputPath = await FileManager.createReadme(
        finalProcessed,
        context.vault,
        context.app,
      );

      // 統計情報を取得
      const {
        totalEmbeds,
        successfulExpansions,
        failedExpansions,
        skippedImages,
        failedFiles,
      } = EmbedExpander.stats;

      // 完了ログ
      console.log(`✅ README.md created at: ${outputPath}`);
      console.log(
        `📊 Total: ${totalEmbeds} | Success: ${successfulExpansions} | Failed: ${failedExpansions} | Skipped images: ${skippedImages}`,
      );

      // 完了通知
      if (totalEmbeds === 0) {
        new Notice("✅ README.md を生成しました（埋め込みなし）", 4000);
      } else if (failedExpansions === 0) {
        const imageNote =
          skippedImages > 0 ? `\n🖼️ ${skippedImages} 件の画像をスキップ` : "";
        new Notice(
          `✅ README.md を生成しました！\n` +
            `📊 ${successfulExpansions}/${totalEmbeds} 件の埋め込みを展開${imageNote}`,
          4000,
        );
      } else {
        // 失敗がある場合
        const failedList = failedFiles
          .slice(0, 3)
          .map((f) => `  • ${f.path} (${f.reason})`)
          .join("\n");
        const moreText =
          failedFiles.length > 3
            ? `\n  ...他 ${failedFiles.length - 3} 件`
            : "";
        const imageNote =
          skippedImages > 0 ? `\n🖼️ ${skippedImages} 件の画像をスキップ` : "";

        new Notice(
          `⚠️ README.md を生成しました\n` +
            `📊 成功: ${successfulExpansions}/${totalEmbeds} | 失敗: ${failedExpansions}${imageNote}\n\n` +
            `失敗した埋め込み:\n${failedList}${moreText}`,
          8000,
        );

        console.warn("❌ Failed expansions:", failedFiles);
      }

      return "";
    } else {
      console.warn("Vault or app not available");
      return finalProcessed;
    }
  } catch (error) {
    console.error("❌ Error in expandEmbeds:", error);
    new Notice(`❌ エラーが発生しました: ${error.message}`, 5000);
    return `/* Error: ${error.message} */`;
  }
};
