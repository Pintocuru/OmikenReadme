// .obsidian/scripts/expandEmbeds.js
module.exports = async (tp) => {
  // 設定
  const MAX_RECURSION_DEPTH = 5;
  const DEFAULT_EXTENSION = ".md";

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

      console.log("=== Context Debug ===");
      console.log("currentFile:", currentFile);
      console.log("currentFile.path:", currentFile?.path);
      console.log("input.file:", input.file);

      return {
        vault: input.app.vault,
        content: content,
        path: currentFile ? currentFile.path : "",
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

    console.log(
      `=== Processing depth ${depth}, content length: ${content.length} ===`
    );

    while ((match = embedRegex.exec(content)) !== null) {
      output += content.slice(lastIndex, match.index);
      lastIndex = embedRegex.lastIndex;

      const link = match[1].trim();
      let linkPath = link.includes(".") ? link : `${link}${DEFAULT_EXTENSION}`;

      if (context.vault && basePath) {
        try {
          console.log(`--- Processing embed: ${link} ---`);
          console.log("linkPath:", linkPath);
          console.log("basePath:", basePath);

          // 拡張子がないので付与する
          const resolvedPath =
            resolvePath(dirname(basePath), linkPath) + DEFAULT_EXTENSION;
          console.log("resolvedPath:", resolvedPath);

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
              console.log(`Found file at: ${candidate}`);
              break;
            }
          }

          if (linkedFile && linkedFile.extension === "md") {
            console.log(`Reading file: ${linkedFile.path}`);
            const linkedContent = await context.vault.cachedRead(linkedFile);
            console.log(`Content read, length: ${linkedContent.length}`);

            // 無限ループ防止：同じファイルを再帰処理しない
            if (linkedFile.path !== basePath) {
              const expandedContent = await expandEmbeds(
                linkedContent,
                linkedFile.path,
                depth + 1
              );
              output += expandedContent;
              console.log(`Expansion complete for: ${linkedFile.path}`);
            } else {
              console.warn(`Skipping self-reference: ${linkedFile.path}`);
              output += `<!-- Self-reference skipped: ${link} -->`;
            }
            continue;
          } else {
            console.warn(`File not found: ${resolvedPath}`);
          }
        } catch (error) {
          console.warn(`Error processing embed [[${linkPath}]]:`, error);
        }
      }

      // 展開できない場合は元の埋め込み記法を保持
      output += match[0];
    }

    output += content.slice(lastIndex);
    console.log(`=== Completed depth ${depth} ===`);
    return output;
  };

  const finalResult = await expandEmbeds(context.content, context.path);

  // デバッグ：結果の確認
  console.log("=== FINAL RESULT ===");
  console.log("Result length:", finalResult.length);
  console.log("Result preview:", finalResult);
  console.log("==================");

  /**
   * TODO:finalResult の結果をREADME.mdに新規作成する
   * (既にREADME.mdがあるなら、消してから新規作成する)
   */

  // Templaterで直接出力するためにtRに追加
  if (typeof tR !== "undefined") {
    tR += finalResult;
    return ""; // tRに出力したので空文字を返す
  }

  return finalResult;
};
