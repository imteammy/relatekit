import { RelateKitError } from "./errors.js";
import type { RelationKey } from "./types.js";

interface Branch<T> {
  readonly children: Map<RelationKey, Branch<T>>;
  readonly values: T[];
}

function branch<T>(): Branch<T> {
  return { children: new Map(), values: [] };
}

export class CompositeIndex<T> {
  readonly #root = branch<T>();

  add(keys: readonly unknown[], value: T, path: string): void {
    const normalized = normalizeKeys(keys, path);
    if (normalized === null) return;
    let node = this.#root;
    for (const key of normalized) {
      let next = node.children.get(key);
      if (next === undefined) {
        next = branch<T>();
        node.children.set(key, next);
      }
      node = next;
    }
    node.values.push(value);
  }

  get(keys: readonly unknown[], path: string): readonly T[] {
    const normalized = normalizeKeys(keys, path);
    if (normalized === null) return [];
    let node = this.#root;
    for (const key of normalized) {
      const next = node.children.get(key);
      if (next === undefined) return [];
      node = next;
    }
    return node.values;
  }
}

const allowedKeys = ["string", "number", "bigint", "boolean", "symbol"];

function normalizeKeys(keys: readonly unknown[], path: string): readonly RelationKey[] | null {
  if (keys.length === 0) {
    throw new RelateKitError("INVALID_CONFIGURATION", "A relation needs at least one key.", path);
  }
  const result: RelationKey[] = [];
  for (const key of keys) {
    if (key === null || key === undefined) return null;
    if (!allowedKeys.includes(typeof key)) {
      throw new RelateKitError("INVALID_KEY", `Relation key at ${path} must be a primitive value.`, path);
    }
    result.push(key as RelationKey);
  }
  return result;
}
