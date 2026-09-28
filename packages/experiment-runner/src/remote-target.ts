import { isIP } from "node:net";

export type RemoteTarget =
  | { evidenceTier: "remote-test"; url: undefined }
  | { evidenceTier: "live-aca"; url: URL };

export function resolveAuthMode(
  bearerToken: string | undefined,
): "none" | "bearer" {
  return bearerToken ? "bearer" : "none";
}

export function resolveExperimentOrigin(
  value: string | undefined,
  evidenceTier: RemoteTarget["evidenceTier"],
): string {
  if (evidenceTier === "remote-test") return "http://127.0.0.1:3000";
  const configured = value ?? "https://copilot.local";
  const url = new URL(configured);
  if (url.protocol !== "https:" || url.origin !== configured)
    throw new Error(
      "EXPERIMENT_ORIGIN must be an HTTPS origin without a path, query, or fragment.",
    );
  return configured;
}

function ipv6Words(hostname: string): number[] | undefined {
  const halves = hostname.split("::");
  if (halves.length > 2) return undefined;
  const parseHalf = (half: string) => {
    if (!half) return [];
    const words: number[] = [];
    for (const part of half.split(":")) {
      if (part.includes(".")) {
        const octets = part.split(".").map(Number);
        if (
          octets.length !== 4 ||
          octets.some(
            (octet) => !Number.isInteger(octet) || octet < 0 || octet > 255,
          )
        )
          return undefined;
        words.push(octets[0]! * 256 + octets[1]!);
        words.push(octets[2]! * 256 + octets[3]!);
      } else {
        const word = Number.parseInt(part, 16);
        if (!/^[\da-f]{1,4}$/i.test(part) || !Number.isInteger(word))
          return undefined;
        words.push(word);
      }
    }
    return words;
  };
  const left = parseHalf(halves[0]!);
  const right = parseHalf(halves[1] ?? "");
  if (!left || !right) return undefined;
  const omitted = 8 - left.length - right.length;
  if (
    omitted < 0 ||
    (halves.length === 1 && omitted !== 0) ||
    (halves.length === 2 && omitted < 1)
  )
    return undefined;
  return [...left, ...Array<number>(omitted).fill(0), ...right];
}

export function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "");
  if (normalized === "localhost" || normalized.endsWith(".localhost"))
    return true;
  if (isIP(normalized) === 4) return Number(normalized.split(".")[0]) === 127;
  if (isIP(normalized) !== 6) return false;
  const words = ipv6Words(normalized);
  if (!words) return false;
  if (words.slice(0, 7).every((word) => word === 0) && words[7] === 1)
    return true;
  const mappedPrefix =
    words.slice(0, 5).every((word) => word === 0) &&
    (words[5] === 0 || words[5] === 0xffff);
  return mappedPrefix && words[6]! >> 8 === 127;
}

function isAcaHostname(hostname: string): boolean {
  return hostname.toLowerCase().endsWith(".azurecontainerapps.io");
}

export function resolveRemoteTarget(args: string[]): RemoteTarget {
  const remoteUrlIndex = args.indexOf("--remote-url");
  const authorized = args.includes("--live-aca-authorized");
  if (remoteUrlIndex === -1) {
    if (authorized)
      throw new Error("--live-aca-authorized requires --remote-url.");
    return { evidenceTier: "remote-test", url: undefined };
  }
  const value = args[remoteUrlIndex + 1];
  if (!value || value.startsWith("--"))
    throw new Error("--remote-url requires an HTTPS URL.");
  if (!authorized)
    throw new Error(
      "Live endpoint use requires explicit --live-aca-authorized confirmation.",
    );
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.port ||
    url.pathname !== "/mcp" ||
    isLoopbackHostname(url.hostname) ||
    !isAcaHostname(url.hostname)
  )
    throw new Error(
      "--remote-url must be an HTTPS *.azurecontainerapps.io/mcp URL without credentials, port, query, or fragment.",
    );
  return { evidenceTier: "live-aca", url };
}
