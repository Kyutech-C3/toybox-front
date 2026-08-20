import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SRC_DIRECTORY = path.resolve("src");
const CSS_MODULE_PATTERN = /index\.module\.css$/;
const STYLE_DOT_REFERENCE_PATTERN = /\bstyles\.([A-Za-z_$][\w$]*)/g;
const STYLE_BRACKET_REFERENCE_PATTERN = /\bstyles\[(["'])([^"']+)\1\]/g;
const CLASS_SELECTOR_PATTERN = /(^|[,}]\s*)\.([A-Za-z_][\w-]*)/gm;
const CUSTOM_PROPERTY_PATTERN = /--([A-Za-z_][\w-]*)/g;
const ATTRIBUTE_SELECTOR_PATTERN = /\[\s*((?:data|aria)-[A-Za-z0-9_-]+)/g;
const KEBAB_CASE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const walkFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });

const toKebabCase = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const getLine = (content, index) => content.slice(0, index).split("\n").length;

export const checkCssModules = ({ fix = false } = {}) => {
  const files = walkFiles(SRC_DIRECTORY);
  const cssFiles = files.filter((file) => file.endsWith(".css"));
  const sourceFiles = files.filter((file) => /\.(?:ts|tsx)$/.test(file));
  const violations = [];

  for (const file of cssFiles) {
    let content = fs.readFileSync(file, "utf8");
    const originalContent = content;
    const renames = new Map();

    if (CSS_MODULE_PATTERN.test(file)) {
      for (const match of content.matchAll(CLASS_SELECTOR_PATTERN)) {
        const className = match[2];
        if (!KEBAB_CASE_PATTERN.test(className)) {
          const replacement = toKebabCase(className);
          violations.push({
            file,
            line: getLine(content, match.index + match[1].length),
            message: `CSS Modules のクラス名 "${className}" は kebab-case ではありません`,
          });
          renames.set(className, replacement);
        }
      }
    }

    for (const match of content.matchAll(CUSTOM_PROPERTY_PATTERN)) {
      if (!KEBAB_CASE_PATTERN.test(match[1])) {
        violations.push({
          file,
          line: getLine(content, match.index),
          message: `CSS custom property "--${match[1]}" は kebab-case ではありません`,
        });
      }
    }

    for (const match of content.matchAll(ATTRIBUTE_SELECTOR_PATTERN)) {
      if (!KEBAB_CASE_PATTERN.test(match[1])) {
        violations.push({
          file,
          line: getLine(content, match.index),
          message: `属性 "${match[1]}" は kebab-case ではありません`,
        });
      }
    }

    if (fix) {
      content = content.replace(
        CLASS_SELECTOR_PATTERN,
        (_match, prefix, className) =>
          `${prefix}.${renames.get(className) ?? className}`,
      );
      content = content.replace(
        CUSTOM_PROPERTY_PATTERN,
        (_match, propertyName) => `--${toKebabCase(propertyName)}`,
      );
      content = content.replace(
        ATTRIBUTE_SELECTOR_PATTERN,
        (_match, attributeName) => `[${toKebabCase(attributeName)}`,
      );
      fs.writeFileSync(file, content);
    }

    if (!fix && content !== originalContent) {
      throw new Error("チェック中に CSS ファイルが変更されました");
    }
  }

  for (const file of sourceFiles) {
    let content = fs.readFileSync(file, "utf8");

    for (const match of content.matchAll(STYLE_DOT_REFERENCE_PATTERN)) {
      violations.push({
        file,
        line: getLine(content, match.index),
        message: `CSS Modules の "styles.${match[1]}" はブラケット記法ではありません`,
      });
    }

    if (fix) {
      content = content.replace(
        STYLE_DOT_REFERENCE_PATTERN,
        (_match, className) => `styles["${toKebabCase(className)}"]`,
      );
      content = content.replace(
        STYLE_BRACKET_REFERENCE_PATTERN,
        (_match, _quote, className) => `styles["${toKebabCase(className)}"]`,
      );
      fs.writeFileSync(file, content);
    }
  }

  return violations;
};

const printViolations = (violations) => {
  for (const violation of violations) {
    console.error(
      `${path.relative(process.cwd(), violation.file)}:${violation.line} ${violation.message}`,
    );
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const isFixMode = process.argv.includes("--fix");
  const violations = checkCssModules({ fix: isFixMode });

  if (isFixMode) {
    const remainingViolations = checkCssModules();
    printViolations(remainingViolations);
    if (remainingViolations.length > 0) process.exitCode = 1;
    else
      console.log(
        `CSS Modules の命名規則を修正しました（検出: ${violations.length} 件）`,
      );
  } else {
    printViolations(violations);
    if (violations.length > 0) process.exitCode = 1;
    else console.log("CSS Modules の命名規則に違反はありません");
  }
}
