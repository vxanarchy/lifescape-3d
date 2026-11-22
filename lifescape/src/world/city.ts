import * as THREE from 'three';

export interface BuildingOptions {
  type: 'residential' | 'commercial' | 'office' | 'hospital' | 'police' | 'garage' | 'restaurant' | 'shop' | 'entertainment';
  width: number;
  height: number;
  depth: number;
  position: THREE.Vector3;
  color?: number;
}

export interface RoadOptions {
  width: number;
  length: number;
  position: THREE.Vector3;
}

export class CityGenerator {
  private buildings: Map<string, THREE.Mesh> = new Map();
  private roads: Map<string, THREE.Mesh> = new Map();
  private streetLights: Map<string, THREE.Mesh> = new Map();
  private chunks: Map<string, THREE.Group> = new Map();

  constructor(private scene: THREE.Scene) {}

  public generateCityBlock(center: THREE.Vector3, size: number = 50): THREE.Group {
    const chunk = new THREE.Group();
    const chunkSizeId = `chunk_${center.x}_${center.z}`;
    this.chunks.set(chunkSizeId, chunk);

    this.generateRoads(chunk, center, size);
    this.generateBuildings(chunk, center, size);
    this.generateStreetLights(chunk, center, size);

    this.scene.add(chunk);
    return chunk;
  }

  private generateRoads(chunk: THREE.Group, center: THREE.Vector3, size: number): void {
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

    const mainRoad = new THREE.BoxGeometry(size * 0.8, 0.1, 2);
    const mainRoadMesh = new THREE.Mesh(mainRoad, roadMaterial);
    mainRoadMesh.position.set(center.x, 0.05, center.z);
    mainRoadMesh.rotation.y = 0;
    mainRoadMesh.receiveShadow = true;
    chunk.add(mainRoadMesh);

    const sideRoad = new THREE.BoxGeometry(2, 0.1, size * 0.8);
    const sideRoadMesh = new THREE.Mesh(sideRoad, roadMaterial);
    sideRoadMesh.position.set(center.x, 0.05, center.z);
    sideRoadMesh.receiveShadow = true;
    chunk.add(sideRoadMesh);
  }

  private generateBuildings(chunk: THREE.Group, center: THREE.Vector3, size: number): void {
    const buildingTypes: BuildingOptions['type'][] = ['residential', 'commercial', 'office', 'restaurant', 'shop'];
    const buildingColors: Record<string, number> = {
      residential: 0x8b7355,
      commercial: 0xb22222,
      office: 0x4682b4,
      restaurant: 0x8b0000,
      shop: 0xdaa520,
      hospital: 0xff8c00,
      police: 0x000080,
      garage: 0x2f4f4f,
      entertainment: 0x9932cc,
    };

    const numBuildings = 15;
    const spacing = size / 4;

    for (let i = 0; i < numBuildings; i++) {
      const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
      const width = 3 + Math.random() * 4;
      const height = 5 + Math.random() * 15;
      const depth = 3 + Math.random() * 4;
      const angle = (i / numBuildings) * Math.PI * 2;
      const distance = spacing * 0.8;
      const x = center.x + Math.cos(angle) * distance + (Math.random() - 0.5) * 4;
      const z = center.z + Math.sin(angle) * distance + (Math.random() - 0.5) * 4;

      const building = this.createBuilding({
        type,
        width,
        height,
        depth,
        position: new THREE.Vector3(x, height / 2, z),
        color: buildingColors[type],
      });

      chunk.add(building);
    }
  }

  private createBuilding(options: BuildingOptions): THREE.Mesh {
    const { type, width, height, depth, position, color } = options;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color || 0x888888,
    });

    const building = new THREE.Mesh(geometry, material);
    building.position.copy(position);
    building.castShadow = true;
    building.receiveShadow = true;

    const buildingId = `building_${position.x}_${position.y}_${position.z}`;
    this.buildings.set(buildingId, building);

    return building;
  }

  private generateStreetLights(chunk: THREE.Group, center: THREE.Vector3, size: number): void {
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 5, 8);

    for (let x = -size / 2 + 5; x < size / 2 - 5; x += 10) {
      for (let z = -size / 2 + 5; z < size / 2 - 5; z += 10) {
        const pole = new THREE.Mesh(poleGeometry, lightMaterial);
        pole.position.set(x, 2.5, z);
        pole.castShadow = true;

        const light = new THREE.PointLight(0xffffff, 1, 30);
        light.position.set(x, 6, z);
        light.castShadow = true;

        chunk.add(pole);
        chunk.add(light);

        const lightId = `light_${x}_${z}`;
        this.streetLights.set(lightId, pole);
      }
    }
  }

  public addSidewalk(chunk: THREE.Group, center: THREE.Vector3, size: number): void {
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });

    const sidewalkGeometry = new THREE.PlaneGeometry(size * 0.6, size * 0.6);
    const sidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(center.x, 0.01, center.z);
    sidewalk.receiveShadow = true;

    chunk.add(sidewalk);
  }

  public loadChunk(chunkId: string): THREE.Group | null {
    return this.chunks.get(chunkId) || null;
  }

  public unloadChunk(chunkId: string): void {
    const chunk = this.chunks.get(chunkId);
    if (chunk) {
      this.scene.remove(chunk);
      chunk.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if ((object.material as THREE.MeshStandardMaterial).map) {
            (object.material as THREE.MeshStandardMaterial).dispose();
          }
        }
      });
      this.chunks.delete(chunkId);
    }
  }

  public getChunkIds(): string[] {
    return Array.from(this.chunks.keys());
  }
}