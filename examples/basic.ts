import { many, one, relate } from "relatekit";

const tasks = [{ id: "t1", organizationId: "org-1", propertyId: "p1" }];
const properties = [{ id: "p1", organizationId: "org-1", name: "HQ" }];
const assignments = [{ id: "a1", organizationId: "org-1", taskId: "t1" }];

const result = relate(tasks, {
  property: one(properties, {
    on: { organizationId: "organizationId", propertyId: "id" },
  }),
  assignments: many(assignments, {
    on: { organizationId: "organizationId", id: "taskId" },
  }),
});

console.log(result);
