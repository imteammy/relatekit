import { many, one, relate } from "../src/index.js";
import * as loose from "../src/loose.js";
import type { Prettify, PrettifyDeep } from "../src/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
  ? (<T>() => T extends B ? 1 : 2) extends (<T>() => T extends A ? 1 : 2) ? true : false
  : false;
type Expect<T extends true> = T;

type Flat = Prettify<{ id: string } & { name: string }>;
type _flatIsReadable = Expect<Equal<Flat, { id: string; name: string }>>;

class Money {
  constructor(private readonly cents: number) {}

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }
}

class FieldOnlyToken {
  constructor(private readonly value: string) {}
}

type _dateIsPreserved = Expect<Equal<PrettifyDeep<{ value: Date }>["value"], Date>>;
type _fileIsPreserved = Expect<Equal<PrettifyDeep<{ value: File }>["value"], File>>;
type _fileListIsPreserved = Expect<Equal<PrettifyDeep<{ value: FileList }>["value"], FileList>>;
type _customClassIsPreserved = Expect<Equal<PrettifyDeep<{ value: Money }>["value"], Money>>;
type _fieldOnlyClassCanBePreserved = Expect<Equal<
  PrettifyDeep<{ value: FieldOnlyToken }, 10, FieldOnlyToken>["value"],
  FieldOnlyToken
>>;

const parents = [{ id: "p1", tenantId: 1, nullableId: null as string | null }] as const;
const children = [{ parentId: "p1", tenant: 1, title: "child" }] as const;

const looseResult = loose.relate(
  [{ id: "p1", tenantId: 1 }],
  ({ one: relatedOne }) => ({
    child: relatedOne([{ parentId: "p1", tenant: 1, value: "child" }], {
      on: { id: "parentId", tenantId: "tenant" },
    }),
  }),
);
const looseValue: string | undefined = looseResult[0]?.child?.value;
void looseValue;

const result = relate(parents, {
  children: many(children, { on: { id: "parentId", tenantId: "tenant" } }),
});
const title: string = result[0]!.children[0]!.title;
void title;

const mutableParents: { id: number }[] = [{ id: 1 }];
const mutableChildren: { parentId: number; name: string }[] = [{ parentId: 1, name: "child" }];
const mutableResult = relate(mutableParents, ({ many: relatedMany }) => ({
  children: relatedMany(mutableChildren, { on: { id: "parentId" } }),
}));
mutableResult.push({ id: 2, children: [] });
mutableResult[0]!.children.push({ parentId: 1, name: "another child" });
mutableResult[0]!.id = 3;

const mutableParent = { id: 1 };
const mutableObjectResult = relate(mutableParent, ({ many: relatedMany }) => ({
  children: relatedMany(mutableChildren, { on: { id: "parentId" } }),
}));
mutableObjectResult.id = 4;
mutableObjectResult.children.push({ parentId: 1, name: "third child" });

const readonlyParents = [{ id: 1 }] as const;
const readonlyChildren = [{ parentId: 1, name: "child" }] as const;
const readonlyResult = relate(readonlyParents, ({ many: relatedMany }) => ({
  children: relatedMany(readonlyChildren, { on: { id: "parentId" } }),
}));
// @ts-expect-error readonly input properties remain readonly
readonlyResult[0]!.id = 2;
// @ts-expect-error readonly input arrays remain readonly
readonlyResult.push({ id: 2, children: [] });
// @ts-expect-error the returned relation array is mutable because relate creates it
readonlyResult[0]!.children.push({ parentId: 1, name: "another child" });

const inferredResult = relate(parents, ({ many: relatedMany }) => ({
  children: relatedMany(children, {
    on: { id: "parentId", tenantId: "tenant" },
  }),
}));
const inferredTitle: string = inferredResult[0]!.children[0]!.title;
void inferredTitle;

const singleResult = relate(parents[0]!, ({ many: relatedMany }) => ({
  children: relatedMany(children, { on: { id: "parentId", tenantId: "tenant" } }),
}));
const singleTitle: string = singleResult.children[0]!.title;
void singleTitle;
// @ts-expect-error an object input returns an object, not an array
singleResult[0];

const singleObjectConfigResult = relate(parents[0]!, {
  children: many(children, { on: { id: "parentId", tenantId: "tenant" } }),
});
const singleObjectConfigTitle: string = singleObjectConfigResult.children[0]!.title;
void singleObjectConfigTitle;

const definedResult = relate(parents, ({ one: relatedOne }) => ({
  child: relatedOne(children, {
    on: { id: "parentId", tenantId: "tenant" },
    defined: true,
  }),
}));
const definedTitle: string = definedResult[0]!.child.title;
void definedTitle;

const optionalResult = relate(parents, ({ one: relatedOne }) => ({
  child: relatedOne(children, { on: { id: "parentId", tenantId: "tenant" } }),
}));
// @ts-expect-error one() remains nullable without defined: true
optionalResult[0]!.child.title;

// @ts-expect-error defined is only valid for one(), not many()
relate(parents, ({ many: relatedMany }) => ({ children: relatedMany(children, { on: { id: "parentId" }, defined: true }) }));

relate(parents, ({ one: relatedOne }) => ({
  child: relatedOne(children, { local: "id", foreign: "parentId" }),
}));

relate(parents, ({ one: relatedOne }) => {
  const child = relatedOne(children, {
    local: ["id", "tenantId"],
    foreign: ["parentId", "tenant"],
  });
  type _localTupleIsInferred = Expect<Equal<
    typeof child.options.local,
    readonly ["id", "tenantId"]
  >>;
  return { child };
});

// @ts-expect-error local is inferred from parent keys
relate(parents, ({ one: relatedOne }) => ({ child: relatedOne(children, { local: "missing", foreign: "parentId" }) }));

// @ts-expect-error foreign is inferred from child keys
relate(parents, ({ one: relatedOne }) => ({ child: relatedOne(children, { local: "id", foreign: "missing" }) }));

// @ts-expect-error on values are inferred from compatible child keys
relate(parents, ({ one: relatedOne }) => ({ child: relatedOne(children, { on: { tenantId: "parentId" } }) }));

// @ts-expect-error inferred composite key lengths must match
relate(parents, ({ one: relatedOne }) => ({ child: relatedOne(children, { local: ["id", "tenantId"], foreign: ["parentId"] }) }));

const nested = relate(parents, {
  child: one(children, {
    on: { id: "parentId", tenantId: "tenant" },
    include: { grandchildren: many([{ childTitle: "child", n: 1 }], { on: { title: "childTitle" } }) },
  }),
});
const count: number | undefined = nested[0]!.child?.grandchildren[0]?.n;
void count;

const callbackNested = relate(parents, ({ one: relatedOne, many: relatedMany }) => ({
  child: relatedOne(children, {
    on: { id: "parentId", tenantId: "tenant" },
    include: ({ many: nestedMany }) => ({
      grandchildren: nestedMany([{ childTitle: "child", n: 1 }], { on: { title: "childTitle" } }),
    }),
  }),
  children: relatedMany(children, {
    on: { id: "parentId" },
    include: ({ one: nestedOne }) => ({
      grandchild: nestedOne([{ childTitle: "child", n: 1 }], { on: { title: "childTitle" } }),
    }),
  }),
}));
const callbackNestedCount: number | undefined = callbackNested[0]!.child?.grandchildren[0]?.n;
const callbackNestedOneCount: number | null | undefined = callbackNested[0]!.children[0]!.grandchild?.n;
void callbackNestedCount;
void callbackNestedOneCount;

type NestedRow = (typeof nested)[number];
type _resultRowIsPrettified = Expect<Equal<keyof NestedRow, "id" | "tenantId" | "nullableId" | "child">>;

type DeepIntersection = {
  l1: { l2: { l3: { l4: { l5: { l6: { l7: { l8: { l9: {
    l10: ({ left: string } & { right: number });
  } } } } } } } } };
};
type DeepDefault = PrettifyDeep<DeepIntersection>;
type _depthTenStops = Expect<Equal<
  DeepDefault["l1"]["l2"]["l3"]["l4"]["l5"]["l6"]["l7"]["l8"]["l9"]["l10"],
  { left: string } & { right: number }
>>;
type DeepEleven = PrettifyDeep<DeepIntersection, 11>;
type _customDepthExpandsFurther = Expect<Equal<
  DeepEleven["l1"]["l2"]["l3"]["l4"]["l5"]["l6"]["l7"]["l8"]["l9"]["l10"],
  { left: string; right: number }
>>;

relate(parents, { child: one(children, { local: ["id", "tenantId"], foreign: ["parentId", "tenant"] }) });

// @ts-expect-error parent key does not exist
relate(parents, { child: one(children, { on: { missing: "parentId" } }) });

// @ts-expect-error child key does not exist
one(children, { on: { id: "missing" } });

// @ts-expect-error key types differ (number and string)
relate(parents, { child: one(children, { on: { tenantId: "parentId" } }) });

// @ts-expect-error tuple lengths differ
relate(parents, { child: one(children, { local: ["id", "tenantId"], foreign: ["parentId"] }) });

relate(parents, { child: one(children, { on: { nullableId: "parentId" } }) });
