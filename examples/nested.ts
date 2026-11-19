import { many, one, relate } from "relatekit";

const tasks = [{ id: 1 }];
const assignments = [{ id: 10, taskId: 1, userId: 100 }];
const users = [{ id: 100, name: "Ada" }];

const result = relate(tasks, {
  assignments: many(assignments, {
    on: { id: "taskId" },
    include: {
      user: one(users, { on: { userId: "id" } }),
    },
  }),
});

console.log(result[0]?.assignments[0]?.user?.name);

const tasksSection = [{ taskId: 1 }];
const assignmentsSection = [{ assingId: 10, taskIdRef: 1, userIdRef: 100 }];
const usersSection = [{ user_id: 100, name: "Ada" }];

const resultSection = relate(tasksSection, (r) => ({
  assignments: r.many(assignmentsSection, {
    on: { taskId: "taskIdRef" },
    include: (r) => ({
      user: r.one(usersSection, {
        on: { userIdRef: 'user_id', },
        defined: true,
      }),
    }),
  }),
}));

console.dir(resultSection, { depth: null });
