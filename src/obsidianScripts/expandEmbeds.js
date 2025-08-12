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
      };
    }

    // ファイルオブジェクトの場合
    if (input.path && input.content !== undefined) {
      return {
        vault: input.vault,
        content: input.content,
        path: input.path,
      };
    }

    // 文字列の場合（直接コンテンツとして扱う）
    if (typeof input === "string") {
      return {
        content: input,
        path: "", // デフォルト値を設定
      };
    }

    return null;
  };

  const context = await getContentContext(tp);
  if (!context) return "/* expandEmbeds: Invalid input */";

  // ヘルパー関数
  const dirname = (path) => {
    // path が文字列でない場合の安全処理
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

  // Templaterタグを除去する関数
  const removeTemplaterTags = (content) => {
    // <%* ... %> 形式のタグを除去
    const templaterRegex = /<%\*[^%]*%>/g;
    return content.replace(templaterRegex, "").trim();
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

    // 新しい正規表現インスタンスを作成（グローバル状態を避ける）
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

          // 拡張子がないので付与する
          const resolvedPath =
            resolvePath(dirname(basePath), linkPath) + DEFAULT_EXTENSION;

          // シンプルなパス候補のみテスト（ファイル一覧取得を避ける）
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
    // Templaterタグを除去してから処理
    const cleanedContent = removeTemplaterTags(context.content);
    console.log(
      `Removed Templater tags, content length: ${cleanedContent.length}`
    );

    // 埋め込みを展開
    const expandedResult = await expandEmbeds(cleanedContent, context.path);

    // README.mdを作成
    if (context.vault && context.app) {
      const result = await createReadmeFile(
        expandedResult,
        context.vault,
        context.app
      );
      console.log("Process completed:", result);

      // Templaterの出力は空文字にする（README.mdに出力したため）
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
