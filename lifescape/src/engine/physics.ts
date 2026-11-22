import * as THREE from 'three';

export interface PhysicsMaterial {
  friction: number;
  restitution: number;
  density: number;
}

export interface RigidbodyDesc {
  shape: 'box' | 'sphere' | 'capsule' | 'cylinder';
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  material?: PhysicsMaterial;
  isStatic?: boolean;
  mass?: number;
}

export class PhysicsWorld {
  private gravity = new THREE.Vector3(0, -9.81, 0);
  private bodies: Map<string, any> = new Map();
  private colliders: Map<string, any> = new Map();

  constructor() {
    // Initialize physics world
  }

  public addRigidbody(desc: RigidbodyDesc, id: string): void {
    // Add physics body to world
    const body = {
      id,
      position: desc.position.clone(),
      rotation: desc.rotation || new THREE.Euler(),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0),
      isStatic: desc.isStatic || false,
      friction: desc.material?.friction ?? 0.5,
      restitution: desc.material?.restitution ?? 0.2,
      mass: desc.material?.density ?? 1,
    };
    this.bodies.set(id, body);
  }

  public step(deltaTime: number): void {
    // Update physics simulation
    for (const body of this.bodies.values()) {
      if (!body.isStatic) {
        body.velocity.addScaledVector(this.gravity, deltaTime);
        body.position.addScaledVector(body.velocity, deltaTime);
      }
    }
  }

  public checkCollision(a: string, b: string): boolean {
    const bodyA = this.bodies.get(a);
    const bodyB = this.bodies.get(b);
    if (!bodyA || !bodyB) return false;

    const distance = bodyA.position.distanceTo(bodyB.position);
    const combinedRadius = 1; // Simplified collision check
    return distance < combinedRadius;
  }

  public getBodies(): IterableIterator<any> {
    return this.bodies.values();
  }

  public getBody(id: string): any | undefined {
    return this.bodies.get(id);
  }

  public removeBody(id: string): void {
    this.bodies.delete(id);
  }

  public setGravity(gravity: THREE.Vector3): void {
    this.gravity.copy(gravity);
  }
}