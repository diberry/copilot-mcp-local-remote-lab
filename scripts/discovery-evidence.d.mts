export interface DiscoveryPluginIdentity {
  pluginName: string;
  pluginVersion: string;
}

export interface DiscoverySummary extends DiscoveryPluginIdentity {
  schemaVersion: 1;
  source: "mcp-sdk-listTools";
  canonicalDiscoverySha256: string;
  toolCount: number;
}

export function prepareDiscoveryEvidence(directory: string): Promise<void>;

export function readGeneratedPluginIdentity(
  root: string,
): Promise<DiscoveryPluginIdentity>;

export function persistDiscoveryEvidence(options: {
  directory: string;
  local: unknown[];
  remoteTest: unknown[];
  pluginIdentity: DiscoveryPluginIdentity;
}): Promise<DiscoverySummary>;
