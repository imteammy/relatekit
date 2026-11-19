export type RelateKitErrorCode = "DUPLICATE_KEY" | "INVALID_KEY" | "INVALID_CONFIGURATION" | "INVALID_CARDINALITY";

export class RelateKitError extends Error {
  constructor(
    public readonly code: RelateKitErrorCode,
    message: string,
    public readonly path?: string,
  ) {
    super(message);
    this.name = "RelateKitError";
  }
}
