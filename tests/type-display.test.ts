import * as path from "node:path";
import * as ts from "typescript";
import { expect, it } from "vitest";

it("displays loose relate results as final object types", () => {
  const config = ts.readConfigFile("tsconfig.types.json", ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const source = program.getSourceFile(path.resolve("tests/types.test.ts"));
  expect(source).toBeDefined();
  if (source === undefined) return;

  let declaration: ts.VariableDeclaration | undefined;
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === "looseResult"
    ) {
      declaration = node;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  expect(declaration).toBeDefined();
  if (declaration === undefined || !ts.isIdentifier(declaration.name)) return;

  const checker = program.getTypeChecker();
  const type = checker.getTypeAtLocation(declaration.name);
  const display = checker.typeToString(type, declaration, ts.TypeFormatFlags.NoTruncation);

  expect(display).toBe(
    "{ id: string; tenantId: number; child: { parentId: string; tenant: number; value: string; } | null; }[]",
  );
  expect(display).not.toContain("RelateResult");
  expect(display).not.toContain("RelationDescriptor");
  expect(display).not.toContain("AnyRelationDescriptor");
});
