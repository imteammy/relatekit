---
name: relatekit
description: Help use the RelateKit TypeScript package to map related rows into typed nested objects. Applies to API questions, relation definitions, TypeScript inference, and troubleshooting RelateKit behavior.
---

# RelateKit

Use this skill when a TypeScript task involves RelateKit. Give examples that fit the user's actual row types, cardinality, and key mapping. For exact or version-sensitive behavior, inspect the installed package declarations or the current RelateKit documentation instead of guessing.

## Core API

- Default to `relatekit` (strict mode); `relatekit/strict` is the explicit equivalent. Use `relatekit/loose` only when the user wants first-match behavior for duplicate `one()` keys.
- `relate(parents, relations)` accepts one object or an array and returns the corresponding shape with configured relations attached. It does not mutate input rows.
- Relations can be passed as an object or built in a callback: `relate(parents, ({ one, many }) => ({ ... }))`. Prefer the callback when it improves parent/child key inference.
- `one(rows, options)` adds one matching row or `null`; `many(rows, options)` adds matching rows in input order, or an empty array.
- Use `on: { parentKey: childKey }` to map parent fields to child fields. Multiple entries form a composite key. The `local` / `foreign` form is also supported; keep paired tuple order and lengths aligned.
- Use `include` for nested relations. Define each nested relation against the row type at that level.
- `one(..., { defined: true })` throws when a match is missing and makes the result property non-nullable.

## TypeScript guidance

- Preserve inferred row types and literal key names; avoid widening relation configurations to `string`, `Record<string, ...>`, or broad descriptor types unless dynamic keys are intentional.
- Result types are expanded for readability up to a default depth of 10. `Prettify` and `PrettifyDeep` are available for application-level types; `PrettifyDeep<T, Depth, Preserve>` supports custom depth and field-only class preservation.
- Result mutability follows the input: mutable source fields stay mutable and readonly source fields stay readonly. Relation arrays returned by `many()` are new mutable arrays.
- Date, File, FileList, arrays, tuples, functions, and class instances with methods should retain their special type behavior during deep prettification. TypeScript cannot identify field-only classes as nominal classes; use the preserve parameter if needed.
- If an inferred result looks like nested `RelationDescriptor` wrappers, inspect the exact call form and installed declarations. Final `relate()` output should read as the composed object shape; descriptors are configuration types, not the intended runtime result shape.

## Runtime policies

- Strict mode throws on duplicate matches for a `one()` relation. Loose mode keeps the first matching row in input order.
- `null` and `undefined` key components do not match. Composite indexing must not depend on delimiter-joined strings.
- Explain missing relations clearly: `one()` gives `null` unless `defined: true`; `many()` gives `[]`.
- RelateKit is synchronous and database-agnostic; callers fetch rows separately and pass them to `relate()`.

## Reusable relation functions

When a user wants to reuse relation definitions, show the form that matches their intended function API. A normal function can accept the current item and related datasets/configuration directly; a curried mapper can bind datasets once and be reused. These are distinct patterns, so do not replace a requested ordinary function with currying alone.

## Verify the local API

When working inside a repository, inspect `package.json`, public exports, declarations, and relevant source/docs before suggesting APIs. This skill includes a snapshot of the project docs under `references/docs/`; read only the reference needed for the task:

- `references/docs/overview.mdx` for RelateKit's purpose and design.
- `references/docs/getting-started.mdx` for installation and first use.
- `references/docs/api.mdx` for signatures and runtime behavior.
- `references/docs/guides/relations.mdx` for cardinality, nesting, and composite keys.
- `references/docs/guides/typescript.mdx` for inference, mutability, and prettified types.
- `references/docs/guides/modes-and-errors.mdx` for strict/loose policies and errors.
- `references/docs/guides/predefined-relate.mdx` for reusable ordinary and curried relation functions.

The references are copied from `website/docs/` and can lag behind code changes. If they conflict with the current package declarations, source, or website docs, trust the current project files and update the reference copies when maintaining the skill.

For code changes, run the checks that fit the change when the user asks for verification or the task requires it; the RelateKit repository exposes `npm run check` and `npm run docs:build`.
