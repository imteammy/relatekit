import { performance } from "node:perf_hooks";
import { afterAll, describe, expect, it } from "vitest";
import { relate } from "../src/index.js";

interface PerformanceMetric {
  readonly scenario: string;
  readonly inputSize: number;
  readonly iterations: number;
  readonly durationMs: number;
  readonly unitsPerSecond: number;
  readonly heapDeltaMb: number;
}

const metrics: PerformanceMetric[] = [];
const emptyChildren: readonly { parentId: number }[] = [];

function measure<T>(
  scenario: string,
  inputSize: number,
  iterations: number,
  operation: () => T,
): T {
  const heapBefore = process.memoryUsage().heapUsed;
  const startedAt = performance.now();
  const result = operation();
  const durationMs = performance.now() - startedAt;
  const heapDeltaMb = (process.memoryUsage().heapUsed - heapBefore) / 1024 / 1024;

  metrics.push({
    scenario,
    inputSize,
    iterations,
    durationMs: round(durationMs),
    unitsPerSecond: Math.round(iterations / Math.max(durationMs / 1_000, Number.EPSILON)),
    heapDeltaMb: round(heapDeltaMb),
  });
  return result;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function createFieldObject(fieldCount: number): { id: number } {
  const row = { id: 1 };
  for (let index = 1; index < fieldCount; index += 1) {
    Reflect.set(row, `field${index}`, index);
  }
  return row;
}

function repeatFieldObject(input: { readonly id: number }, iterations: number) {
  let result = relate(input, ({ many: relatedMany }) => ({
    children: relatedMany(emptyChildren, { on: { id: "parentId" } }),
  }));
  for (let index = 1; index < iterations; index += 1) {
    result = relate(input, ({ many: relatedMany }) => ({
      children: relatedMany(emptyChildren, { on: { id: "parentId" } }),
    }));
  }
  return result;
}

function repeatArrayFieldObject(
  input: { readonly id: number; readonly values: readonly number[] },
  iterations: number,
) {
  let result = relate(input, ({ many: relatedMany }) => ({
    children: relatedMany(emptyChildren, { on: { id: "parentId" } }),
  }));
  for (let index = 1; index < iterations; index += 1) {
    result = relate(input, ({ many: relatedMany }) => ({
      children: relatedMany(emptyChildren, { on: { id: "parentId" } }),
    }));
  }
  return result;
}

function readMaximumRows(): number {
  const configured = process.env.RELATEKIT_PERF_MAX_ROWS;
  if (configured === undefined) return 4_000_000;
  const parsed = Number(configured);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error("RELATEKIT_PERF_MAX_ROWS must be a positive integer.");
  }
  return parsed;
}

afterAll(() => {
  console.table(metrics);
});

describe("single object performance", () => {
  it.each([
    { name: "object/few-fields", fields: 5, iterations: 5_000 },
    { name: "object/mid-fields", fields: 50, iterations: 1_000 },
    { name: "object/large-fields", fields: 500, iterations: 100 },
  ])("$name", ({ name, fields, iterations }) => {
    const input = createFieldObject(fields);
    const result = measure(name, fields, iterations, () => repeatFieldObject(input, iterations));

    expect(result.id).toBe(1);
    expect(result.children).toEqual([]);
    expect(Object.keys(result)).toHaveLength(fields + 1);
  });

  it("object/with-array-field", () => {
    const input = { id: 1, values: Array.from({ length: 10_000 }, (_, index) => index) };
    const iterations = 5_000;
    const result = measure("object/with-array-field", input.values.length, iterations, () => (
      repeatArrayFieldObject(input, iterations)
    ));

    expect(result.values).toBe(input.values);
    expect(result.values).toHaveLength(10_000);
    expect(result.children).toEqual([]);
  });
});

describe("array performance", () => {
  const maximumRows = readMaximumRows();
  const sizes = [10, 100, 1_000, 10_000, 100_000, 1_000_000, 4_000_000]
    .filter(size => size <= maximumRows);

  it.each(sizes)("array/%i-rows", size => {
    const input = Array.from({ length: size }, (_, id) => ({ id }));
    const result = measure(`array/${size}-rows`, size, size, () => relate(
      input,
      ({ many: relatedMany }) => ({
        children: relatedMany(emptyChildren, { on: { id: "parentId" } }),
      }),
    ));


    expect(result).toHaveLength(size);
    expect(result[0]?.id).toBe(0);
    expect(result[size - 1]?.id).toBe(size - 1);
    expect(result[0]?.children).toEqual([]);
    expect(result[size - 1]?.children).toEqual([]);
  });
});
