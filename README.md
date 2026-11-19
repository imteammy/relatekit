# RelateKit

RelateKit turns separate arrays into typed nested objects. It is synchronous, has no runtime dependencies, does not mutate its inputs, and does not depend on an ORM or database driver.

Version 0.1 is strict by default. Importing from `relatekit` and `relatekit/strict` gives the same behavior. `relatekit/loose` changes duplicate handling for `one()`.

## Install

```sh
npm install relatekit
```

RelateKit requires Node.js 18 or newer and uses ESM.

Run the documentation site locally with `npm run docs:start`. See [website/README.md](website/README.md) for the build command.

## Install the RelateKit agent skill

Install the RelateKit skill into an agent-supported project with the Skills CLI:

```sh
npx skills add imteammy/relatekit --skill relatekit
```

The Skills CLI requires Node.js 22.20 or newer. This is separate from RelateKit itself, which supports Node.js 18 or newer. See the [Skills CLI documentation](https://skills.sh/docs/cli) for agent selection and global installation options.

## Basic use

```ts
import { many, one, relate } from "relatekit";

const tasks = [{ id: "t1", propertyId: "p1" }];
const properties = [{ id: "p1", name: "HQ" }];
const assignments = [{ id: "a1", taskId: "t1" }];

const result = relate(tasks, {
  property: one(properties, { on: { propertyId: "id" } }),
  assignments: many(assignments, { on: { id: "taskId" } }),
});
```

`on` maps a parent field to a child field. A missing `one()` relation becomes `null`; a missing `many()` relation becomes `[]`.

`relate()` also accepts one parent object. An object input returns one related object instead of an array:

```ts
const task = { id: "t1" };

const result = relate(task, ({ many }) => ({
  assignments: many(assignments, { on: { id: "taskId" } }),
}));

result.assignments; // Assignment[]
```

Both the callback form and relation object form accept either a single parent object or an array of parents.

Require a `one()` relation with `defined: true` when absence is a data error:

```ts
const result = relate(tasks, ({ one }) => ({
  property: one(properties, {
    on: { propertyId: "id" },
    defined: true,
  }),
}));

result[0].property.name; // property is not nullable
```

If no child matches, RelateKit throws `RelateKitError` with code `INVALID_CARDINALITY` and the relation path. `many()` does not accept `defined` because it always returns an array.

## Key inference and autocomplete

Use the callback form when you want the editor to infer both sides of a relation while you type:

```ts
const result = relate(tasks, ({ one, many }) => ({
  property: one(properties, {
    on: { propertyId: "id" },
  }),
  assignments: many(assignments, {
    local: "id",
    foreign: "taskId",
  }),
}));
```

The callback binds `one` and `many` to the parent row type. RelateKit therefore autocompletes `on` keys and `local` from `tasks`, then autocompletes `on` values and `foreign` from the child rows. It also excludes child keys whose value type cannot match the selected parent key.

Use another callback in `include` to repeat the same inference at a nested level:

```ts
const result = relate(tasks, ({ many }) => ({
  assignments: many(assignments, {
    on: { id: "taskId" },
    include: ({ one }) => ({
      user: one(users, { local: "userId", foreign: "id" }),
    }),
  }),
}));
```

The object form shown in the basic example remains supported. It validates the keys once TypeScript evaluates the complete relation object, but the callback form provides richer autocomplete while editing.

## Composite keys

Add more fields to `on`. Every field must match.

```ts
const result = relate(tasks, {
  property: one(properties, {
    on: {
      organizationId: "organizationId",
      propertyId: "id",
    },
  }),
});
```

Tuple syntax is also supported. Use the callback form so `local` is inferred from the parent row keys:

```ts
const result = relate(tasks, ({ one }) => ({
  property: one(properties, {
    local: ["organizationId", "propertyId"],
    foreign: ["organizationId", "id"],
  }),
}));
```

Here `local` is inferred as `readonly ["organizationId", "propertyId"]`. Each item autocompletes from `keyof Task`; it is not widened to `readonly [string, ...string[]]`.

RelateKit stores composite keys in nested `Map` objects. It never joins values into a string, so values containing separators cannot collide. A `null` or `undefined` component never matches.

## Nested relations

```ts
const result = relate(tasks, {
  assignments: many(assignments, {
    on: { id: "taskId" },
    include: {
      user: one(users, { on: { userId: "id" } }),
    },
  }),
});
```

The return type includes every nested relation. Relation names, key names, tuple lengths, and key value types are checked by TypeScript.

### Readable result types

RelateKit prettifies every `relate()` result so editor tooltips show one readable object type instead of nested intersections. Expansion stops after 10 levels to keep TypeScript responsive.

The same utilities are available for application types:

```ts
import type { Prettify, PrettifyDeep } from "relatekit";

type User = Prettify<UserRow & { roles: Role[] }>;
type Response = PrettifyDeep<RawResponse>;     // up to 10 levels
type WiderResponse = PrettifyDeep<RawResponse, 15>;
```

Arrays, readonly arrays, tuples, functions, `Date`, `File`, `FileList`, and objects with methods keep their behavior during expansion. This also preserves normal custom class instances.

TypeScript cannot distinguish a class containing only fields from a plain object because both have the same structural shape. Pass those classes as the third type parameter:

```ts
type Response = PrettifyDeep<RawResponse, 10, FieldOnlyClass | AnotherValueClass>;
```

## Strict and loose modes

Strict mode throws `RelateKitError` with code `DUPLICATE_KEY` when a `one()` relation finds more than one child.

```ts
import { relate } from "relatekit"; // strict
// or: import { relate } from "relatekit/strict";
```

Loose mode keeps the first matching child. Input order decides which child wins.

```ts
import { many, one, relate } from "relatekit/loose";
```

Both modes preserve child order in `many()` and return new objects at every mapped level.

## Errors

`RelateKitError` exposes `code` and `path`. Version 0.1 defines these codes:

- `DUPLICATE_KEY`
- `INVALID_KEY`
- `INVALID_CONFIGURATION`
- `INVALID_CARDINALITY`

## Scope of 0.1

This release maps arrays already in memory. Async loading, SQL generation, flat joined-row expansion, caching, permissions, and transactions are outside the 0.1 API.

## Performance tests

Run the dedicated performance suite separately from normal tests:

```sh
npm run test:performance
```

It measures single objects with 5, 50, and 500 fields, an object containing a 10,000-item array, and parent arrays containing 10, 100, 1,000, 10,000, 100,000, 1,000,000, and 4,000,000 rows. Fixture creation is excluded from the measured duration. The report includes duration, rows or operations per second, and heap delta.

Set `RELATEKIT_PERF_MAX_ROWS` to cap the largest array case during local development. The default is 4,000,000 rows.
