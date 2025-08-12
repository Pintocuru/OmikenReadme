// src\generateReadmes.ts
import fs from "fs";
import path from "path";

// 更新日記録ファイル
const TIMESTAMP_FILE = path.resolve("src/readmeTimestamps.json");

// dockフォルダ
const DOCK_DIR = path.resolve("dock");

// 記録データ読み込み
let timestamps: Record<string, string> = {};
if (fs.existsSync(TIMESTAMP_FILE)) {
  timestamps = JSON.parse(fs.readFileSync(TIMESTAMP_FILE, "utf8"));
}

// dock配下のパッケージ一覧取得
const packages = fs
  .readdirSync(DOCK_DIR, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

for (const pkg of packages) {
  const pkgDir = path.join(DOCK_DIR, pkg);
  const templatePath = path.join(pkgDir, "README.template.md");
  const outputPath = path.join(pkgDir, "README.md");

  if (!fs.existsSync(templatePath)) {
    console.warn(`[SKIP] ${pkg}: README.template.md がありません`);
    continue;
  }

  const stat = fs.statSync(templatePath);
  const lastModified = stat.mtime.toISOString();

  // 更新日比較
  if (timestamps[pkg] && timestamps[pkg] === lastModified) {
    console.log(`[SKIP] ${pkg}: 更新なし`);
    continue;
  }

  // テンプレート読み込み
  let content = fs.readFileSync(templatePath, "utf8");

  // プレースホルダー置換（例）
  // TODO:ここの処理
  const today = new Date().toISOString().split("T")[0];
  content = content.replace(/{{DATE}}/g, today);

  // 出力
  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`[OK] ${pkg}: README.md を更新`);

  // タイムスタンプ更新
  timestamps[pkg] = lastModified;
}

// JSON保存
fs.writeFileSync(TIMESTAMP_FILE, JSON.stringify(timestamps, null, 2), "utf8");
console.log("✅ 完了");
