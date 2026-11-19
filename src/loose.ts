import { makeMany, makeOne, makeRelate } from "./core/api.js";

export const one = makeOne;
export const many = makeMany;
export const relate = makeRelate({ duplicateOne: "first" });

export { RelateKitError } from "./core/errors.js";
export type { RelateKitErrorCode } from "./core/errors.js";
export type { RelationBuilders } from "./core/api.js";
export type { Prettify, PrettifyDeep, RelateItem, RelationKey, RelateResult } from "./core/types.js";
