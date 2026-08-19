import ts from "typescript";

import { checkCssModules } from "./check-kebab-case.js";

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SRC_DIRECTORY = path.resolve("src");
const PASCAL_CASE_PATTERN = /^[A-Z][A-Za-z0-9]*$/;
const CAMEL_CASE_PATTERN = /^[a-z][A-Za-z0-9]*$/;
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;
const HANDLER_PATTERN = /^on[A-Z]/;
const BOOLEAN_PREFIX_PATTERN = /^(?:is|has|can)[A-Z]/;

const walkFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });

const getLine = (sourceFile, node) =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

const replaceIdentifier = (content, from, to) =>
  content.replace(new RegExp(`\\b${from}\\b`, "g"), to);

const collectTypeScriptViolations = (file, content) => {
  const sourceFile = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const violations = [];

  const report = (node, message) =>
    violations.push({ file, line: getLine(sourceFile, node), message });

  const visit = (node) => {
    if (
      (ts.isTypeAliasDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      !PASCAL_CASE_PATTERN.test(node.name.text)
    ) {
      report(
        node.name,
        `型名 "${node.name.text}" は PascalCase ではありません`,
      );
    }

    if (
      (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      /Prop$/.test(node.name.text)
    ) {
      report(
        node.name,
        `Props 型 "${node.name.text}" は Props で終わっていません`,
      );
    }

    if (
      ts.isPropertySignature(node) &&
      node.type?.kind === ts.SyntaxKind.BooleanKeyword &&
      ts.isIdentifier(node.name) &&
      !BOOLEAN_PREFIX_PATTERN.test(node.name.text)
    ) {
      report(
        node.name,
        `boolean "${node.name.text}" は is / has / can で始まっていません`,
      );
    }

    if (
      ts.isPropertySignature(node) &&
      ts.isIdentifier(node.name) &&
      ts.isFunctionTypeNode(node.type) &&
      (ts.isTypeAliasDeclaration(node.parent) ||
        ts.isInterfaceDeclaration(node.parent)) &&
      node.parent.name.text.endsWith("Props") &&
      !/^on[A-Z]/.test(node.name.text) &&
      !/^render[A-Z]/.test(node.name.text)
    ) {
      report(
        node.name,
        `callback prop "${node.name.text}" は on で始まっていません`,
      );
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      HANDLER_PATTERN.test(node.name.text) &&
      (ts.isArrowFunction(node.initializer) ||
        ts.isFunctionExpression(node.initializer))
    ) {
      report(
        node.name,
        `イベントハンドラ "${node.name.text}" は handle で始まっていません`,
      );
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isArrayBindingPattern(node.name) &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText(sourceFile) === "useState" &&
      (node.initializer.typeArguments?.[0]?.kind ===
        ts.SyntaxKind.BooleanKeyword ||
        node.initializer.arguments[0]?.kind === ts.SyntaxKind.TrueKeyword ||
        node.initializer.arguments[0]?.kind === ts.SyntaxKind.FalseKeyword)
    ) {
      const stateName = node.name.elements[0]?.name;
      if (
        stateName &&
        ts.isIdentifier(stateName) &&
        !BOOLEAN_PREFIX_PATTERN.test(stateName.text)
      ) {
        report(
          stateName,
          `boolean state "${stateName.text}" は is / has / can で始まっていません`,
        );
      }
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      PASCAL_CASE_PATTERN.test(node.name.text) &&
      (ts.isArrowFunction(node.initializer) ||
        ts.isFunctionExpression(node.initializer)) &&
      node.initializer.parameters[0]?.type &&
      ts.isTypeLiteralNode(node.initializer.parameters[0].type)
    ) {
      report(
        node.initializer.parameters[0],
        `コンポーネントの Props 型は "${node.name.text}Props" として宣言してください`,
      );
    }

    if (
      ts.isJsxAttribute(node) &&
      /^(?:data|aria)-/.test(node.name.getText(sourceFile)) &&
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(node.name.getText(sourceFile))
    ) {
      report(
        node.name,
        `JSX 属性 "${node.name.getText(sourceFile)}" は kebab-case ではありません`,
      );
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      ts.isVariableDeclarationList(node.parent) &&
      ts.isVariableStatement(node.parent.parent) &&
      ts.isSourceFile(node.parent.parent.parent) &&
      node.initializer &&
      !ts.isArrowFunction(node.initializer) &&
      !ts.isFunctionExpression(node.initializer) &&
      !node.name.text.startsWith("use") &&
      !(
        file.endsWith(".stories.tsx") &&
        PASCAL_CASE_PATTERN.test(node.name.text)
      ) &&
      !UPPER_SNAKE_CASE_PATTERN.test(node.name.text)
    ) {
      report(
        node.name,
        `モジュール定数 "${node.name.text}" は UPPER_SNAKE_CASE ではありません`,
      );
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      /^use[A-Z]/.test(node.name.text) &&
      (ts.isArrowFunction(node.initializer) ||
        ts.isFunctionExpression(node.initializer))
    ) {
      const featureName = node.name.text.slice(3);
      const expectedParamsName = `Use${featureName}Params`;
      const expectedReturnName = `Use${featureName}Return`;
      const parameter = node.initializer.parameters[0];
      if (
        parameter &&
        (!parameter.type ||
          parameter.type.getText(sourceFile) !== expectedParamsName)
      ) {
        report(
          parameter,
          `hook の引数型は "${expectedParamsName}" にしてください`,
        );
      }
      if (
        !node.initializer.type ||
        node.initializer.type.getText(sourceFile) !== expectedReturnName
      ) {
        report(
          node.name,
          `hook の戻り値型は "${expectedReturnName}" にしてください`,
        );
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  const relativePath = path.relative(SRC_DIRECTORY, file);
  const basename = path.basename(file).replace(/\.(?:d\.)?tsx?$/, "");
  const isSpecialFilename = ["App", "index", "vite-env"].includes(basename);
  if (
    !isSpecialFilename &&
    !file.endsWith(".stories.tsx") &&
    !CAMEL_CASE_PATTERN.test(basename)
  ) {
    violations.push({
      file,
      line: 1,
      message: `ファイル名 "${path.basename(file)}" が命名規則に一致しません`,
    });
  }

  if (relativePath.includes(`${path.sep}hooks${path.sep}`)) {
    violations.push({
      file,
      line: 1,
      message: "custom hook は hooks/ ではなく hook/ に配置してください",
    });
  }

  return violations;
};

const applySafeFixes = (file, content) => {
  const sourceFile = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const renames = new Map();

  const visit = (node) => {
    if (
      (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      /Prop$/.test(node.name.text)
    ) {
      renames.set(node.name.text, `${node.name.text}s`);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  let fixedContent = content;
  for (const [from, to] of renames) {
    fixedContent = replaceIdentifier(fixedContent, from, to);
  }
  return fixedContent;
};

const checkTypeScript = ({ fix = false } = {}) => {
  const files = walkFiles(SRC_DIRECTORY).filter((file) =>
    /\.(?:ts|tsx)$/.test(file),
  );
  const violations = [];

  for (const file of files.filter((file) =>
    file.endsWith(`${path.sep}index.tsx`),
  )) {
    const directoryName = path.basename(path.dirname(file));
    if (!PASCAL_CASE_PATTERN.test(directoryName)) {
      violations.push({
        file,
        line: 1,
        message: `コンポーネントディレクトリ "${directoryName}" は PascalCase ではありません`,
      });
    }
  }

  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    violations.push(...collectTypeScriptViolations(file, content));
    if (fix) {
      content = applySafeFixes(file, content);
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
  const detectedViolations = [
    ...checkCssModules({ fix: isFixMode }),
    ...checkTypeScript({ fix: isFixMode }),
  ];

  if (isFixMode) {
    const remainingViolations = [...checkCssModules(), ...checkTypeScript()];
    printViolations(remainingViolations);
    if (remainingViolations.length > 0) {
      console.error(
        `自動修正後も ${remainingViolations.length} 件の確認が必要です（修正: ${detectedViolations.length - remainingViolations.length} 件）`,
      );
      process.exitCode = 1;
    } else {
      console.log(
        `命名規則を修正しました（検出: ${detectedViolations.length} 件）`,
      );
    }
  } else {
    printViolations(detectedViolations);
    if (detectedViolations.length > 0) process.exitCode = 1;
    else console.log("命名規則に違反はありません");
  }
}
