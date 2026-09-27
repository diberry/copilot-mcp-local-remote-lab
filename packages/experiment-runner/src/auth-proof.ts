export async function proveBearerEnforcement(
  endpoint: URL,
  origin: string,
  request: (
    endpoint: URL,
    init: RequestInit,
  ) => Promise<{ status: number }> = fetch,
) {
  const response = await request(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      origin,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "auth-proof",
      method: "initialize",
      params: {
        protocolVersion: "2026-07-28",
        capabilities: {},
        clientInfo: { name: "experiment-auth-proof", version: "1.0.0" },
      },
    }),
  });
  if (response.status !== 401)
    throw new Error(
      `Authentication evidence rejected: unauthenticated probe returned ${response.status}, expected 401.`,
    );
  return { unauthenticatedStatus: 401 as const };
}
