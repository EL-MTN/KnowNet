import { KnowledgeNetwork } from './core';
import { StorageService } from './services';

let network: KnowledgeNetwork | null = null;
let storageServiceInstance: StorageService | null = null;

export async function getNetworkInstance(): Promise<KnowledgeNetwork> {
  if (!network) {
    const storage = getStorageService();
    network = await storage.load();
  }
  return network;
}

export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService('./data/knowledge.json');
  }
  return storageServiceInstance;
}

export async function saveNetwork(): Promise<void> {
  if (network) {
    const storage = getStorageService();
    await storage.save(network);
  }
}

export const networkInstance = {
  getNetwork: getNetworkInstance,
  save: saveNetwork,
};