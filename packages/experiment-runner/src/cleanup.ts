export type Cleanup = () => void | Promise<void>;

export class CleanupStack {
  readonly #cleanups: Cleanup[] = [];

  defer(cleanup: Cleanup) {
    this.#cleanups.push(cleanup);
  }

  async close() {
    const errors: unknown[] = [];
    for (const cleanup of this.#cleanups.reverse()) {
      try {
        await cleanup();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0)
      throw new AggregateError(errors, "Resource cleanup failed.");
  }
}

export async function withCleanup<T>(
  operation: (cleanup: CleanupStack) => Promise<T>,
): Promise<T> {
  const cleanup = new CleanupStack();
  try {
    return await operation(cleanup);
  } finally {
    await cleanup.close();
  }
}
