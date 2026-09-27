export interface PluginComparison {
  fileCount: number;
  differences: string[];
}

export function comparePluginTrees(
  localDirectory: string,
  remoteDirectory: string,
  options?: {
    verifyInventories?: boolean;
    inventoryDirectory?: string;
  },
): Promise<PluginComparison>;
