export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerStats {
  health: number;
  energy: number;
  hunger: number;
  happiness: number;
}

export interface Vehicle {
  id: string;
  model: string;
  position: Vector3;
  rotation: number;
  velocity: Vector3;
  isDriven: boolean;
  fuel: number;
  maxFuel: number;
}

export interface NPC {
  id: string;
  name: string;
  position: Vector3;
  rotation: number;
  schedule: NPCSchedule;
}

export interface NPCSchedule {
  workHours: { start: number; end: number };
  homeHours: { start: number; end: number };
  favoriteSpots: string[];
  activities: string[];
}

export interface Job {
  id: string;
  name: string;
  description: string;
  location: string;
  requirements: Record<string, number>;
  salary: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  description: string;
  reward: number;
  completed: boolean;
}

export interface Property {
  id: string;
  type: 'residential' | 'commercial' | 'industrial';
  position: Vector3;
  price: number;
  owned: boolean;
}

export interface GameSettings {
  graphics: 'low' | 'medium' | 'high';
  audio: {
    master: number;
    music: number;
    sfx: number;
  };
  controls: {
    keyBindings: Record<string, string>;
  };
}

export interface GameState {
  playerPosition: Vector3;
  playerRotation: number;
  money: number;
  bankBalance: number;
  currentJob: string | null;
  ownedProperties: string[];
  ownedVehicles: string[];
  missionProgress: Record<string, number>;
}

export interface Building {
  id: string;
  type: 'residential' | 'commercial' | 'office' | 'hospital' | 'police' | 'garage' | 'restaurant' | 'shop' | 'entertainment';
  position: Vector3;
  size: Vector3;
  interiors: boolean;
}