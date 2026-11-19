import { describe, expect, it } from "vitest";
import { RelateKitError, one, relate } from "../src/index.js";
import * as loose from "../src/loose.js";

describe("relation functions", () => {
  it("binds parent and child keys in the inferred callback API", () => {
    const parents = [{ id: "p1", tenantId: 1 }];
    const children = [{ parentId: "p1", tenant: 1, value: "matched" }];
    const result = relate(parents, ({ one: relatedOne }) => ({
      child: relatedOne(children, {
        on: { id: "parentId", tenantId: "tenant" },
      }),
    }));

    expect(result[0]?.child?.value).toBe("matched");
  });

  it("returns a defined one relation when a match exists", () => {
    const result = relate([{ id: "p1" }], ({ one: relatedOne }) => ({
      child: relatedOne([{ parentId: "p1", value: "required" }], {
        on: { id: "parentId" },
        defined: true,
      }),
    }));

    expect(result[0]?.child.value).toBe("required");
  });

  it("throws when a defined one relation has no match", () => {
    expect(() => relate([{ id: "missing" }], ({ one: relatedOne }) => ({
      child: relatedOne([{ parentId: "p1" }], {
        on: { id: "parentId" },
        defined: true,
      }),
    }))).toThrowError(expect.objectContaining<Partial<RelateKitError>>({
      code: "INVALID_CARDINALITY",
      path: "$.child",
    }));
  });

  it("supports tuple composite keys", () => {
    const parents = [{ organizationId: "o1", propertyId: "p1" }];
    const properties = [{ organizationId: "o1", id: "p1", name: "North" }];
    const result = relate(parents, {
      property: one(properties, {
        local: ["organizationId", "propertyId"],
        foreign: ["organizationId", "id"],
      }),
    });

    expect(result[0]?.property?.name).toBe("North");
  });

  it("keeps composite keys collision-free", () => {
    const parents = [{ a: "a:b", b: "c" }, { a: "a", b: "b:c" }];
    const children = [
      { x: "a:b", y: "c", value: 1 },
      { x: "a", y: "b:c", value: 2 },
    ];
    const result = relate(parents, { child: one(children, { on: { a: "x", b: "y" } }) });

    expect(result.map(row => row.child?.value)).toEqual([1, 2]);
  });

  it("throws a coded error for duplicate strict one matches", () => {
    expect(() => relate([{ id: 1 }], {
        child: one([{ parentId: 1 }, { parentId: 1 }], { on: { id: "parentId" } }),
      })).toThrowError(expect.objectContaining<Partial<RelateKitError>>({
        code: "DUPLICATE_KEY",
        path: "$.child",
      }));
  });

  it("uses the first duplicate one match in loose mode", () => {
    const result = loose.relate([{ id: 1 }], {
      child: loose.one([
        { parentId: 1, value: "first" },
        { parentId: 1, value: "second" },
      ], { on: { id: "parentId" } }),
    });

    expect(result[0]?.child?.value).toBe("first");
  });

  it("does not match nullish keys", () => {
    const result = relate([{ id: null as string | null }], {
      child: one([{ parentId: null as string | null }], { on: { id: "parentId" } }),
    });

    expect(result[0]?.child).toBeNull();
  });
});
