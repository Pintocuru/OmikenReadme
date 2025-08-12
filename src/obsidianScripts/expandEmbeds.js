// .obsidian/scripts/expandEmbeds.js
module.exports = async (tp) => {
  // 設定
  const MAX_RECURSION_DEPTH = 5;
  const DEFAULT_EXTENSION = ".md";
  const OUTPUT_FILENAME = "README.md";

  // コンテキスト取得
  const getContentContext = async (input) => {
    if (!input) return null;

    // Templaterのtpオブジェクトの場合
    if (input.app && input.file) {
      // 現在のアクティブファイルを取得
      const currentFile = input.app.workspace.getActiveFile();
      const content = currentFile
        ? await input.app.vault.cachedRead(currentFile)
        : "";

      console.log("Processing file:", currentFile?.path);

      return {
        vault: input.app.vault,
        content: content,
        path: currentFile ? currentFile.path : "",
        app: input.app,
        tp: input, // Templaterオブジェクトを保持
      };
    }

    return null;
  };

  const context = await getContentContext(tp);
  if (!context) return "/* expandEmbeds: Invalid input */";

  // ヘルパー関数
  const dirname = (path) => {
    if (typeof path !== "string" || !path) return "";
    const lastSlash = path.lastIndexOf("/");
    return lastSlash === -1 ? "" : path.slice(0, lastSlash);
  };

  const resolvePath = (basePath, relativePath) => {
    if (!basePath || typeof basePath !== "string") return relativePath;
    if (!relativePath || typeof relativePath !== "string") return "";
    if (relativePath.startsWith("/")) return relativePath.slice(1);

    const baseParts = basePath.split("/").filter(Boolean);
    const relParts = relativePath.split("/").filter(Boolean);

    const result = [];
    baseParts.forEach((part) => result.push(part));

    relParts.forEach((part) => {
      if (part === "..") {
        if (result.length > 0) result.pop();
      } else if (part !== ".") {
        result.push(part);
      }
    });

    return result.join("/");
  };

  // Templaterタグを処理する関数（expandEmbeds専用タグのみ除去）
  const removeExpandEmbedsTag = (content) => {
    // expandEmbeds呼び出しのタグのみ除去
    const expandEmbedsRegex =
      /<%\*\s*await\s+tp\.user\.expandEmbeds\(tp\)\s*%>/g;
    return content.replace(expandEmbedsRegex, "").trim();
  };

  // Templaterタグを実際に評価・変換する関数
  const processTemplaterTags = async (content, tpObject) => {
    try {
      // 日付タグの処理
      const dateRegex = /<%\s*tp\.date\.now\(['"]([^'"]+)['"]\)\s*%>/g;
      let processedContent = content;

      let match;
      while ((match = dateRegex.exec(content)) !== null) {
        const format = match[1];
        const currentDate = tpObject.date.now(format);
        processedContent = processedContent.replace(match[0], currentDate);
        console.log(`Converted date tag: ${match[0]} → ${currentDate}`);
      }

      // 他のTemplaterタグも同様に処理可能（必要に応じて拡張）
      // 例: <% tp.file.title %>, <% tp.date.yesterday() %> など

      return processedContent;
    } catch (error) {
      console.warn("Error processing Templater tags:", error);
      return content;
    }
  };

  // メイン処理
  const expandEmbeds = async (content, basePath, depth = 0) => {
    if (depth > MAX_RECURSION_DEPTH) {
      console.warn(`Maximum recursion depth (${MAX_RECURSION_DEPTH}) reached`);
      return content;
    }

    if (typeof content !== "string") {
      console.warn("Content is not a string:", typeof content);
      return "";
    }

    // 埋め込み展開処理
    const embedRegex = /!\[\[([^\]]+)\]\]/g;
    let output = "";
    let lastIndex = 0;
    let match;

    if (depth === 0) {
      console.log(
        `Starting embed expansion, content length: ${content.length}`
      );
    }

    while ((match = embedRegex.exec(content)) !== null) {
      output += content.slice(lastIndex, match.index);
      lastIndex = embedRegex.lastIndex;

      const link = match[1].trim();
      let linkPath = link.includes(".") ? link : `${link}${DEFAULT_EXTENSION}`;

      if (context.vault && basePath) {
        try {
          console.log(`Processing embed: ${link}`);

          const resolvedPath =
            resolvePath(dirname(basePath), linkPath) + DEFAULT_EXTENSION;

          const pathCandidates = [
            resolvedPath,
            linkPath,
            linkPath.startsWith("../") ? linkPath : resolvedPath,
          ];

          let linkedFile = null;
          for (const candidate of pathCandidates) {
            linkedFile = context.vault.getAbstractFileByPath(candidate);
            if (linkedFile) {
              console.log(`Found file: ${candidate}`);
              break;
            }
          }

          if (linkedFile && linkedFile.extension === "md") {
            const linkedContent = await context.vault.cachedRead(linkedFile);

            // 無限ループ防止：同じファイルを再帰処理しない
            if (linkedFile.path !== basePath) {
              const expandedContent = await expandEmbeds(
                linkedContent,
                linkedFile.path,
                depth + 1
              );
              output += expandedContent;
            } else {
              console.warn(`Skipping self-reference: ${linkedFile.path}`);
              output += `<!-- Self-reference skipped: ${link} -->`;
            }
            continue;
          } else {
            console.warn(`File not found: ${link}`);
          }
        } catch (error) {
          console.warn(`Error processing embed [[${linkPath}]]:`, error);
        }
      }

      // 展開できない場合は元の埋め込み記法を保持
      output += match[0];
    }

    output += content.slice(lastIndex);
    return output;
  };

  // README.md作成・更新関数
  const createReadmeFile = async (content, vault, app) => {
    try {
      // 現在のファイルのディレクトリを取得
      const currentFile = app.workspace.getActiveFile();
      const currentDir = currentFile ? dirname(currentFile.path) : "";
      const readmePath = currentDir
        ? `${currentDir}/${OUTPUT_FILENAME}`
        : OUTPUT_FILENAME;

      // 既存のREADME.mdがあるかチェック
      const existingFile = vault.getAbstractFileByPath(readmePath);

      if (existingFile) {
        console.log(`Deleting existing ${OUTPUT_FILENAME}: ${readmePath}`);
        await vault.delete(existingFile);
      }

      // 新しいREADME.mdを作成
      console.log(`Creating new ${OUTPUT_FILENAME}: ${readmePath}`);
      await vault.create(readmePath, content);

      console.log(`Successfully created ${OUTPUT_FILENAME}`);
      return `Successfully created ${OUTPUT_FILENAME} at ${readmePath}`;
    } catch (error) {
      console.error(`Error creating ${OUTPUT_FILENAME}:`, error);
      return `Error creating ${OUTPUT_FILENAME}: ${error.message}`;
    }
  };

  // メイン実行
  try {
    // 1. expandEmbedsタグのみ除去（他のTemplaterタグは保持）
    const contentWithoutExpandTag = removeExpandEmbedsTag(context.content);
    console.log(
      `Removed expandEmbeds tag, content length: ${contentWithoutExpandTag.length}`
    );

    // 2. Templaterタグを変換（日付など）
    const processedContent = await processTemplaterTags(
      contentWithoutExpandTag,
      context.tp
    );
    console.log(
      `Processed Templater tags, content length: ${processedContent.length}`
    );

    // 3. 埋め込みを展開
    const expandedResult = await expandEmbeds(processedContent, context.path);

    // 4. README.mdを作成
    if (context.vault && context.app) {
      const result = await createReadmeFile(
        expandedResult,
        context.vault,
        context.app
      );
      console.log("Process completed:", result);

      // 6. 完了通知を表示
      new Notice("✅ README.md の生成が完了しました！", 3000);

      // 5. 元ファイルは変更しない、Templaterの出力も空文字
      return "";
    } else {
      console.warn("Vault or app not available, returning expanded content");
      return expandedResult;
    }
  } catch (error) {
    console.error("Error in expandEmbeds:", error);
    return `/* Error: ${error.message} */`;
  }
};
