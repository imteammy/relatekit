import { runRelate } from "./engine.js";
import type { Policy } from "./engine.js";
import type {
  AnyRelationDescriptor,
  InferredRelationOptions,
  IsDefined,
  PrettifyDeep,
  RelationDescriptor,
  RelationOptions,
  RelationResults,
  ValidateRelationOptions,
  ValidateRelations,
} from "./types.js";

type Include = Readonly<Record<string, AnyRelationDescriptor>>;
type IncludeFactory<C, R extends Include = Include> = (relations: RelationBuilders<C>) => R;
type ResolvedOptionsInclude<O> = O extends { readonly include: infer I } ? I : undefined;

export interface RelationBuilders<P> {
  one<C, const I extends Include, const O extends InferredRelationOptions<P, C> & { readonly defined?: true }>(
    rows: readonly C[],
    options: O & { readonly include: IncludeFactory<C, I> } & ValidateRelationOptions<P, C, O>,
  ): RelationDescriptor<C, "one", I, O, IsDefined<O>>;

  one<
    C,
    const O extends InferredRelationOptions<P, C> & {
      readonly defined?: true;
      readonly include?: Include;
    },
  >(
    rows: readonly C[],
    options: O & ValidateRelationOptions<P, C, O>,
  ): RelationDescriptor<C, "one", ResolvedOptionsInclude<O>, O, IsDefined<O>>;

  many<C, const I extends Include, const O extends InferredRelationOptions<P, C> & { readonly defined?: never }>(
    rows: readonly C[],
    options: O & { readonly include: IncludeFactory<C, I> } & ValidateRelationOptions<P, C, O>,
  ): RelationDescriptor<C, "many", I, O, false>;

  many<
    C,
    const O extends InferredRelationOptions<P, C> & {
      readonly defined?: never;
      readonly include?: Include;
    },
  >(
    rows: readonly C[],
    options: PrettifyDeep<O & ValidateRelationOptions<P, C, O>>,
  ): RelationDescriptor<C, "many", ResolvedOptionsInclude<O>, O, false>;
}

export function makeOne<
  C,
  const O extends RelationOptions<C> & { readonly defined?: true; readonly include?: Include },
>(rows: readonly C[], options: O): RelationDescriptor<C, "one", ResolvedOptionsInclude<O>, O, IsDefined<O>> {
  const include = resolveStaticInclude(options);
  return { kind: "one", rows, options, include, defined: (options.defined === true) as IsDefined<O> };
}

export function makeMany<
  C,
  const O extends RelationOptions<C> & { readonly defined?: never; readonly include?: Include },
>(rows: readonly C[], options: O): RelationDescriptor<C, "many", ResolvedOptionsInclude<O>, O, false> {
  const include = resolveStaticInclude(options);
  return { kind: "many", rows, options, include, defined: false };
}

export interface Relate {
  <
    P,
    const R extends Readonly<Record<string, AnyRelationDescriptor>>,
  >(parents: P[], relations: R & ValidateRelations<P, R>): PrettifyDeep<P & RelationResults<R>>[];
  <
    P,
    const R extends Readonly<Record<string, AnyRelationDescriptor>>,
  >(parents: P[], factory: (relations: RelationBuilders<P>) => R): PrettifyDeep<P & RelationResults<R>>[];
  <
    P,
    const R extends Readonly<Record<string, AnyRelationDescriptor>>,
  >(parents: readonly P[], relations: R & ValidateRelations<P, R>): readonly PrettifyDeep<P & RelationResults<R>>[];
  <
    P,
    const R extends Readonly<Record<string, AnyRelationDescriptor>>,
  >(parents: readonly P[], factory: (relations: RelationBuilders<P>) => R): readonly PrettifyDeep<P & RelationResults<R>>[];
  <
    P,
    const R extends Readonly<Record<string, AnyRelationDescriptor>>,
  >(parent: P, relations: R & ValidateRelations<P, R>): PrettifyDeep<P & RelationResults<R>>;
  <
    P,
    const R extends Readonly<Record<string, AnyRelationDescriptor>>,
  >(parent: P, factory: (relations: RelationBuilders<P>) => R): PrettifyDeep<P & RelationResults<R>>;
}

type RuntimeRelations = Readonly<Record<string, AnyRelationDescriptor>>;
type RuntimeRelationFactory = (relations: RelationBuilders<unknown>) => RuntimeRelations;

export function makeRelate(policy: Policy): Relate {
  return executeRelate.bind(undefined, policy) as Relate;
}

export function executeRelate(
  policy: Policy,
  parents: unknown | readonly unknown[],
  relationsOrFactory: RuntimeRelations | RuntimeRelationFactory,
): unknown | readonly unknown[] {
  const relations = typeof relationsOrFactory === "function"
    ? relationsOrFactory(createRelationBuilders<unknown>())
    : relationsOrFactory;
  const multiple = Array.isArray(parents);
  const result = runRelate(multiple ? parents : [parents], relations, policy);
  return multiple ? result : result[0];
}

export function createRelationBuilders<P>(): RelationBuilders<P> {
  return {
    one: createOneRelation,
    many: createManyRelation,
  } as unknown as RelationBuilders<P>;
}

export function createOneRelation<
  P,
  C,
  const O extends InferredRelationOptions<P, C> & {
    readonly defined?: true;
    readonly include?: Include | IncludeFactory<C>;
  },
>(
  rows: readonly C[],
  options: O & ValidateRelationOptions<P, C, O>,
): RelationDescriptor<C, "one", ResolvedOptionsInclude<O>, O, IsDefined<O>> {
  return {
    kind: "one",
    rows,
    options,
    include: resolveInclude<C, O>(options),
    defined: (options.defined === true) as IsDefined<O>,
  };
}

export function createManyRelation<
  P,
  C,
  const O extends InferredRelationOptions<P, C> & {
    readonly defined?: never;
    readonly include?: Include | IncludeFactory<C>;
  },
>(
  rows: readonly C[],
  options: O & ValidateRelationOptions<P, C, O>,
): RelationDescriptor<C, "many", ResolvedOptionsInclude<O>, O, false> {
  return {
    kind: "many",
    rows,
    options,
    include: resolveInclude<C, O>(options),
    defined: false,
  };
}

function resolveInclude<
  C,
  O extends { readonly include?: Include | IncludeFactory<C> },
>(options: O): ResolvedOptionsInclude<O> {
  const includeInput = options.include;
  const include = typeof includeInput === "function"
    ? includeInput(createRelationBuilders<C>())
    : includeInput;
  return include as ResolvedOptionsInclude<O>;
}

function resolveStaticInclude<O extends { readonly include?: Include }>(options: O): ResolvedOptionsInclude<O> {
  return options.include as ResolvedOptionsInclude<O>;
}
