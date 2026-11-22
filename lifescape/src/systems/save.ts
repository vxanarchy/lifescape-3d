import { z } from 'zod';
import type { GameState, Money, ValidatedJob, ValidatedProperty, PlayerStats } from '@/types';
import type EconomySystem from '@/systems/economy';
import type JobSystem from '@/systems/jobs';
import type PropertySystem from '@/systems/properties';

// Save schema validation
export const SaveSchema = z.object({
  position: z.object({ x: z.number(), y: number(), z: number() }).optional(),
  rotation: z.number().optional(),
  money: z.object({ cash: z.number(), bank: z.number(), total: z.number() }).default({ cash: 0, bank: 0, total: 0 }),
  inventory: z.array(z.object({ id: z.string(), name: z.string(), value: z.number() })).default([]),
  currentJob: z.string().optional(),
  ownedProperties: z.array(z.string()).default([]),
  missionProgress: z.record(z.number()).default({}),
  timestamp: z.number().default(Date.now()),
});

export type SaveData = z.infer<typeof SaveSchema>;

export interface SaveGameOptions {
  autosave: boolean;
  includeInventory: boolean;
  includeProgress: boolean;
}

export class SaveSystem {
  private saveKey: string = 'lifescape_save';
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.load();
    this.startAutoSave();
  }

  private getSaveData(): SaveData {
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) {
      return {
        position: undefined,
        rotation: undefined,
        money: { cash: 1, bank: 1, total: 1 },
        inventory: [],
        currentJob: undefined,
        ownedProperties: [],
        missionProgress: {},
        timestamp: Date.now(),
      };
    }

    try {
      return SaveSchema.parse(JSON.parse(raw));
    } catch {
      // Corrupted save - reset
      console.warn('[Save] Corrupted save data, resetting');
      return this.getInitialSaveData();
    }
  }

  private getInitialSaveData(): SaveData {
    return {
      position: undefined,
      rotation: undefined,
      money: { cash: 1, bank: 1, total: 1 },
      inventory: [],
      currentJob: undefined,
      ownedProperties: [],
      missionProgress: {},
      timestamp: Date.now(),
    };
  }

  public save(
    position: THREE.Vector3,
    money: Money,
    currentJob: string | undefined,
    ownedProperties: string[],
    options: SaveGameOptions = { autosave: true, includeInventory: true, includeProgress: true }
  ): void {
    const data: SaveData = {
      position: position ? { x: position.x, y: position.y, z: position.z } : undefined,
      rotation: position ? position.x : undefined, // Using x as rotation placeholder
      money,
      currentJob,
      ownedProperties: options.includeInventory ? [...ownedProperties] : [],
      missionProgress: options.includeProgress ? {} : {},
      timestamp: Date.now(),
    };

    localStorage.setItem(this.saveKey, JSON.stringify(data));
    console.log('[Save] Game saved successfully');
  }

  public load(): SaveData {
    return this.getSaveData();
  }

  public clearSave(): void {
    localStorage.removeItem(this.saveKey);
    console.log('[Save] Save file cleared');
  }

  public getSaveTimestamp(): number | null {
    const data = this.load();
    return data.timestamp > 0 ? data.timestamp : null;
  }

  public hasSavedGame(): boolean {
    const data = this.load();
    return data.money.total > 0; // Has save if money exists
  }

  public startAutoSave(interval: number = 300000): void {
    // Auto-save every 5 minutes (300000ms)
    if (this.autoSaveTimeout) {
      clearInterval(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setInterval(() => {
      // Would need reference to game state to autosave
      // this.save(player.position, economy.getMoney(), ...);
      console.log('[Save] Auto-save triggered (interval)');
    }, interval);
  }

  public stopAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearInterval(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

  public dispose(): void {
    this.stopAutoSave();
    localStorage.removeItem(this.saveKey);
  }
}