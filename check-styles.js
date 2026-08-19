import fs from 'node:fs';
import path from 'node:path';

// ES Modules用の __dirname の代わり (Node.js 20.11以降で使用可能)
const currentDir = import.meta.dirname;

// チェック対象のディレクトリ（srcフォルダ）
const TARGET_DIR = path.join(currentDir, 'src');
// styles.xxx にマッチする正規表現
const REGEX = /styles\.[a-zA-Z_$][a-zA-Z0-9_$]*/;

let hasError = false;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      checkFile(filePath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (REGEX.test(line)) {
      // プロジェクト内の相対パスを見やすく表示
      const relativePath = path.relative(currentDir, filePath);
      console.error(`❌ エラー: ${relativePath}:${index + 1}`);
      console.error(`   ドット記法が使用されています: ${line.trim()}`);
      console.error(`   ブラケット記法 (styles["..."]) に修正してください。\n`);
      hasError = true;
    }
  });
}

console.log('🔍 stylesのドット記法をチェック中...');
walk(TARGET_DIR);

if (hasError) {
  process.exit(1);
} else {
  console.log('✅ ドット記法は見つかりませんでした。');
}
