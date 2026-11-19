export type RelationKey = string | number | bigint | boolean | symbol;

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

type Atomic = string | number | bigint | boolean | symbol | null | undefined | Date | RegExp | Error;
type CallableMemberKeys<T extends object> = {
  [K in keyof T]-?: T[K] extends (...args: never[]) => unknown ? K : never;
}[keyof T];
type HasCallableMembers<T extends object> = [CallableMemberKeys<T>] extends [never] ? false : true;

// type PrettifyDeepRaw<T> = T extends Atomic? T: {
//   [K in keyof T]: T[K] extends object ? PrettifyDeep<T[K]> : T[K];
// } & {};

/**
 * Expands object intersections into readable object types without recursing
 * forever. Ten levels are expanded by default; values below the limit keep
 * their original type. Objects with methods, including File, FileList, and
 * class instances, are preserved. Pass field-only class types as Preserve.
 */
export type PrettifyDeep<
  T,
  MaxDepth extends number = 10,
  Preserve = never,
  Depth extends readonly unknown[] = [],
> = Depth["length"] extends MaxDepth
  ? T
  : T extends Atomic | Preserve
    ? T
    : T extends (...args: never[]) => unknown
      ? T
      : T extends readonly [unknown, ...unknown[]]
        ? { [K in keyof T]: PrettifyDeep<T[K], MaxDepth, Preserve, readonly [...Depth, unknown]> }
        : T extends readonly (infer Item)[]
          ? T extends (infer MutableItem)[]
            ? PrettifyDeep<MutableItem, MaxDepth, Preserve, readonly [...Depth, unknown]>[]
            : PrettifyDeep<Item, MaxDepth, Preserve, readonly [...Depth, unknown]>[]
          : T extends object
            ? HasCallableMembers<T> extends true
              ? T
              : { [K in keyof T]: PrettifyDeep<T[K], MaxDepth, Preserve, readonly [...Depth, unknown]> } & {}
            : T;

export type KeyName<T> = Extract<keyof T, string>;

export type RelationMap<C> = Readonly<Record<string, KeyName<C>>>;

export type SingleKeyOptions<C> = Readonly<{
  local: string;
  foreign: KeyName<C>;
}>;

export type CompositeKeyOptions<C> = Readonly<{
  local: readonly [string, ...string[]];
  foreign: readonly [KeyName<C>, ...KeyName<C>[]];
}>;

export type OnOptions<C> = Readonly<{ on: RelationMap<C> }>;

export type RelationOptions<C> = OnOptions<C> | SingleKeyOptions<C> | CompositeKeyOptions<C>;

export type Cardinality = "one" | "many";
export type IsDefined<O> = O extends { readonly defined: true } ? true : false;

export interface RelationDescriptor<C, K extends Cardinality, I, O = RelationOptions<C>, D extends boolean = false> {
  readonly kind: K;
  readonly rows: readonly C[];
  readonly options: O;
  readonly include: I;
  readonly defined: D;
}

export interface AnyRelationDescriptor {
  readonly kind: Cardinality;
  readonly rows: readonly unknown[];
  readonly options: unknown;
  readonly include: unknown;
  readonly defined: boolean;
}

type NonNullish<T> = Exclude<T, null | undefined>;
type Widen<T> = T extends string ? string
  : T extends number ? number
  : T extends bigint ? bigint
  : T extends boolean ? boolean
  : T extends symbol ? symbol
  : T;
type Compatible<A, B> = [Widen<NonNullish<A>>] extends [Widen<NonNullish<B>>]
  ? [Widen<NonNullish<B>>] extends [Widen<NonNullish<A>>] ? true : false
  : false;

type CompatibleKeyName<Value, Row> = {
  [K in KeyName<Row>]: Compatible<Value, Row[K]> extends true ? K : never;
}[KeyName<Row>];

export type InferredOnOptions<P, C> = Readonly<{
  on: Readonly<Partial<{
    [L in KeyName<P>]: CompatibleKeyName<P[L], C>;
  }>>;
}>;

export type InferredSingleKeyOptions<P, C> = {
  [L in KeyName<P>]: Readonly<{
    local: L;
    foreign: CompatibleKeyName<P[L], C>;
  }>;
}[KeyName<P>];

export type InferredCompositeKeyOptions<P, C> = Readonly<{
  local: readonly [KeyName<P>, ...KeyName<P>[]];
  foreign: readonly [KeyName<C>, ...KeyName<C>[]];
}>;

export type InferredRelationOptions<P, C> =
  | InferredOnOptions<P, C>
  | InferredSingleKeyOptions<P, C>
  | InferredCompositeKeyOptions<P, C>;

type ValidateOn<P, C, M> = M extends Readonly<Record<string, keyof C>>
  ? {
      [L in keyof M]: L extends keyof P
        ? M[L] extends keyof C
          ? Compatible<P[L], C[M[L]]> extends true ? unknown : never
          : never
        : never;
    }[keyof M] extends never ? never : unknown
  : never;

type ValidateTuple<P, C, L, F> = L extends readonly [infer LH, ...infer LT]
  ? F extends readonly [infer FH, ...infer FT]
    ? LH extends keyof P
      ? FH extends keyof C
        ? Compatible<P[LH], C[FH]> extends true
          ? LT extends readonly []
            ? FT extends readonly [] ? unknown : never
            : ValidateTuple<P, C, LT, FT>
          : never
        : never
      : never
    : never
  : F extends readonly [] ? unknown : never;

export type ValidateRelationOptions<P, C, O> = O extends { readonly on: infer M }
  ? ValidateOn<P, C, M>
  : O extends { readonly local: infer L; readonly foreign: infer F }
    ? L extends readonly [string, ...string[]]
      ? F extends readonly [keyof C, ...(keyof C)[]] ? ValidateTuple<P, C, L, F> : never
      : L extends keyof P
        ? F extends keyof C ? Compatible<P[L], C[F]> extends true ? unknown : never : never
        : never
    : never;

export type ValidateRelations<P, R> = R extends Readonly<Record<string, AnyRelationDescriptor>>
  ? { [N in keyof R]: R[N] extends RelationDescriptor<infer C, Cardinality, infer I, infer O, boolean>
      ? R[N] & ValidateRelationOptions<P, C, O> & (I extends undefined
          ? unknown
          : I extends Readonly<Record<string, AnyRelationDescriptor>>
            ? { readonly include: I & ValidateRelations<C, I> }
            : never)
      : never }
  : never;

export type Related<C, I> = I extends Readonly<Record<string, AnyRelationDescriptor>>
  ? C & RelationResults<I>
  : C;

export type RelationResults<R> = {
  -readonly [N in keyof R]: R[N] extends RelationDescriptor<infer C, infer K, infer I, unknown, infer D>
    ? K extends "one"
      ? D extends true ? Related<C, I> : Related<C, I> | null
      : Related<C, I>[]
    : never;
};

export type RelateItem<P, R> = PrettifyDeep<P & RelationResults<R>>;
export type RelateResult<P, R> = readonly RelateItem<P, R>[];
