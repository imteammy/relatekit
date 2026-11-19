import { describe, expect, it } from "vitest";
import {
  createManyRelation,
  createOneRelation,
  createRelationBuilders,
  executeRelate,
} from "../src/core/api.js";

type Parent = { id: string };
type Child = { parentId: string; value: string };
type OneOptions = {
  readonly on: { readonly id: "parentId" };
  readonly defined: true;
};
type ManyOptions = {
  readonly on: { readonly id: "parentId" };
};

describe("relation builders", () => {
  it("creates one relation descriptors independently", () => {
    const relation = createOneRelation<Parent, Child, OneOptions>(
      [{ parentId: "p1", value: "one" }],
      { on: { id: "parentId" }, defined: true },
    );

    expect(relation.kind).toBe("one");
    expect(relation.defined).toBe(true);
    expect(relation.include).toBeUndefined();
  });

  it("creates many relation descriptors independently", () => {
    const relation = createManyRelation<Parent, Child, ManyOptions>(
      [{ parentId: "p1", value: "many" }],
      { on: { id: "parentId" } },
    );

    expect(relation.kind).toBe("many");
    expect(relation.defined).toBe(false);
  });

  it("creates parent-bound builders independently", () => {
    const builders = createRelationBuilders<Parent>();
    const relation = builders.one(
      [{ parentId: "p1", value: "bound" }],
      { on: { id: "parentId" }, defined: true },
    );

    expect(relation.rows[0]?.value).toBe("bound");
  });

  it("executes relations independently from makeRelate", () => {
    const builders = createRelationBuilders<Parent>();
    const relations = {
      children: builders.many(
        [{ parentId: "p1", value: "child" }],
        { on: { id: "parentId" } },
      ),
    };
    const result = executeRelate(
      { duplicateOne: "throw" },
      { id: "p1" },
      relations,
    );

    expect(result).toEqual({
      id: "p1",
      children: [{ parentId: "p1", value: "child" }],
    });
  });
});
