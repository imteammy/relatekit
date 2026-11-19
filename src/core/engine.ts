import { RelateKitError } from "./errors.js";
import { CompositeIndex } from "./indexer.js";
import type { AnyRelationDescriptor, RelationOptions } from "./types.js";

export interface Policy {
  readonly duplicateOne: "throw" | "first";
}

type RuntimeRelation = AnyRelationDescriptor;
type RuntimeRelations = Readonly<Record<string, RuntimeRelation>>;
type Row = Readonly<{
  readonly [x: string]: unknown;
  readonly [x: number]: unknown;
  readonly [x: symbol]: unknown;
}>;

export function runRelate(parents: readonly unknown[], relations: RuntimeRelations, policy: Policy): readonly unknown[] {
  return mapLevel(parents, relations, policy, "$");
}

function mapLevel(parents: readonly unknown[], relations: RuntimeRelations, policy: Policy, path: string): readonly unknown[] {
  const prepared = Object.entries(relations).map(([name, relation]) => prepare(name, relation, policy, path));
  return parents.map((parent, parentIndex) => {
    const row = toRow(parent, `${path}[${parentIndex}]`);
    const additions: Record<string, unknown> = {};
    for (const relation of prepared) additions[relation.name] = relation.resolve(row);
    return { ...row, ...additions };
  });
}

function prepare(name: string, relation: RuntimeRelation, policy: Policy, parentPath: string) {
  const path = `${parentPath}.${name}`;
  const mapping = normalizeMapping(relation.options as RelationOptions<unknown>, path);
  const index = new CompositeIndex<Row>();
  relation.rows.forEach((item, itemIndex) => {
    const row = toRow(item, `${path}.rows[${itemIndex}]`);
    index.add(mapping.map(([, foreign]) => row[foreign]), row, path);
  });

  return {
    name,
    resolve(parent: Row): unknown {
      const matches = index.get(mapping.map(([local]) => parent[local]), path);
      if (relation.kind === "one") {
        if (matches.length > 1 && policy.duplicateOne === "throw") {
          throw new RelateKitError("DUPLICATE_KEY", `Expected one match at ${path}, found ${matches.length}.`, path);
        }
        const match = matches[0];
        if (match === undefined) {
          if (relation.defined) {
            throw new RelateKitError("INVALID_CARDINALITY", `Expected a defined relation at ${path}, found no match.`, path);
          }
          return null;
        }
        return hydrate(match, relation.include, policy, path);
      }
      return matches.map(match => hydrate(match, relation.include, policy, path));
    },
  };
}

function hydrate(row: Row, include: unknown, policy: Policy, path: string): unknown {
  if (include === undefined) return { ...row };
  return mapLevel([row], include as RuntimeRelations, policy, path)[0];
}

function resolveKey(key: string | readonly [string, ...string[]]): readonly [string, ...string[]] {
  return typeof key === "string" ? [key] as const : key;
}

function normalizeMapping(options: RelationOptions<unknown>, path: string): readonly (readonly [string, string])[] {
  if ("on" in options) {
    const entries = Object.entries(options.on);
    if (entries.length === 0) throw new RelateKitError("INVALID_CONFIGURATION", "The 'on' mapping cannot be empty.", path);
    return entries;
  }
  const local = resolveKey(options.local);
  const foreign = resolveKey(options.foreign);
  if (local.length !== foreign.length) {
    throw new RelateKitError("INVALID_CONFIGURATION", "Local and foreign key counts must match.", path);
  }
  return local.map((key, index) => [key, foreign[index] ?? ""] as const);
}

function toRow(value: unknown, path: string): Row {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RelateKitError("INVALID_KEY", `Expected an object row at ${path}.`, path);
  }
  return value as Row;
}
