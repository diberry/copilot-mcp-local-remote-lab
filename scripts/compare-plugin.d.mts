export interface PluginComparison {
  localFileCount: number;
  remoteFileCount: number;
  companionFileCount: number;
  artifactSha256: string;
}

export function comparePluginTrees(
  localDirectory: string,
  remoteDirectory: string,
  options: {
    companionDirectory: string;
    verifyInventories?: boolean;
    inventoryDirectory?: string;
  },
): Promise<PluginComparison>;
