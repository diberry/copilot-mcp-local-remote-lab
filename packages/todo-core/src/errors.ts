export type ErrorCategory =
  | "validation"
  | "not_found"
  | "conflict"
  | "internal";

export class TodoError extends Error {
  constructor(
    public readonly category: ErrorCategory,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function normalizeError(error: unknown) {
  if (error instanceof TodoError) {
    return {
      category: error.category,
      code: error.code,
      message: error.message,
    };
  }
  return {
    category: "internal" as const,
    code: "INTERNAL",
    message: "The operation failed.",
  };
}
