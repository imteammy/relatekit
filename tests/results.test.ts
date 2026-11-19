import { describe, expect, it } from "vitest";
import { many, one, relate } from "../src/index.js";

describe("relation results", () => {
  it("maps one parent object and returns one related object", () => {
    const task = { id: "t1" };
    const assignments = [{ id: "a1", taskId: "t1" }];
    const result = relate(task, ({ many: relatedMany }) => ({
      assignments: relatedMany(assignments, { on: { id: "taskId" } }),
    }));

    expect(result).toEqual({
      id: "t1",
      assignments: [{ id: "a1", taskId: "t1" }],
    });
  });

  it("supports relation objects with one parent object", () => {
    const result = relate(
      { id: "t1" },
      { assignments: many([{ id: "a1", taskId: "t1" }], { on: { id: "taskId" } }) },
    );

    expect(result.assignments).toHaveLength(1);
  });

  it("infers parent keys again for nested include callbacks", () => {
    const tasks = [{ id: "t1" }];
    const assignments = [{ id: "a1", taskId: "t1", userId: "u1" }];
    const users = [{ id: "u1", name: "Ada" }];
    const result = relate(tasks, ({ many: relatedMany }) => ({
      assignments: relatedMany(assignments, {
        on: { id: "taskId" },
        include: ({ one: relatedOne }) => ({
          user: relatedOne(users, { local: "userId", foreign: "id" }),
        }),
      }),
    }));

    expect(result[0]?.assignments[0]?.user?.name).toBe("Ada");
  });

  it("builds one, many, nested, and missing relation values", () => {
    const tasks = [
      { id: "t1", organizationId: "o1", propertyId: "p1" },
      { id: "t2", organizationId: "o1", propertyId: null },
    ] as const;
    const properties = [{ id: "p1", organizationId: "o1", name: "North" }] as const;
    const assignments = [
      { id: "a1", organizationId: "o1", taskId: "t1", userId: "u1" },
      { id: "a2", organizationId: "o1", taskId: "t1", userId: "u2" },
    ] as const;
    const users = [
      { id: "u1", organizationId: "o1", name: "Ada" },
      { id: "u2", organizationId: "o1", name: "Lin" },
    ] as const;

    const result = relate(tasks, {
      property: one(properties, { on: { organizationId: "organizationId", propertyId: "id" } }),
      assignments: many(assignments, {
        on: { organizationId: "organizationId", id: "taskId" },
        include: {
          user: one(users, { on: { organizationId: "organizationId", userId: "id" } }),
        },
      }),
    });

    expect(result).toEqual([
      {
        id: "t1", organizationId: "o1", propertyId: "p1",
        property: { id: "p1", organizationId: "o1", name: "North" },
        assignments: [
          { id: "a1", organizationId: "o1", taskId: "t1", userId: "u1", user: { id: "u1", organizationId: "o1", name: "Ada" } },
          { id: "a2", organizationId: "o1", taskId: "t1", userId: "u2", user: { id: "u2", organizationId: "o1", name: "Lin" } },
        ],
      },
      { id: "t2", organizationId: "o1", propertyId: null, property: null, assignments: [] },
    ]);
  });

  it("returns new objects without mutating input rows", () => {
    const task = Object.freeze({ id: "t1" });
    const child = Object.freeze({ id: "c1", taskId: "t1" });
    const parents = Object.freeze([task]);
    const children = Object.freeze([child]);
    const result = relate(parents, { children: many(children, { on: { id: "taskId" } }) });

    expect(result[0]).not.toBe(task);
    expect(result[0]?.children[0]).not.toBe(child);
    expect(task).toEqual({ id: "t1" });
    expect(child).toEqual({ id: "c1", taskId: "t1" });
  });
});
