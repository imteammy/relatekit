import { relate } from "relatekit";

const tasks = [{ id: "t1", propertyId: "p1" }];
const properties = [{ id: "p1", name: "HQ" }];
const assignments = [{ id: "a1", taskId: "t1", userId: "u1" }];
const users = [{ id: "u1", name: "Ada" }];

const result = relate(tasks, ({ one, many }) => ({
  property: one(properties, { on: { propertyId: "id" } }),
  assignments: many(assignments, {
    local: "id",
    foreign: "taskId",
    include: ({ one }) => ({
      user: one(users, { on: { userId: "id" } }),
    }),
  }),
}));

console.log(result[0]?.assignments[0]?.user?.name);
