import * as THREE from 'three';
import { InputManager, InputState } from '@/engine/input';
import { PhysicsWorld } from '@/engine/physics';

export interface PlayerConfig {
  moveSpeed: number;
  runSpeedMultiplier: number;
  jumpForce: number;
  gravity: number;
}

export class PlayerController {
  public model: THREE.Group;
  public camera: THREE.PerspectiveCamera;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private isGrounded: boolean = false;
  private inputManager: InputManager;
  private physics: PhysicsWorld;
  private config: PlayerConfig;
  private yaw: number = 0;
  private pitch: number = 0;

  constructor(
    camera: THREE.PerspectiveCamera,
    inputManager: InputManager,
    physics: PhysicsWorld,
    config: Partial<PlayerConfig> = {}
  ) {
    this.config = {
      moveSpeed: 5,
      runSpeedMultiplier: 1.5,
      jumpForce: 5,
      gravity: -9.81,
      ...config,
    };

    this.inputManager = inputManager;
    this.physics = physics;
    this.camera = camera;

    this.model = new THREE.Group();
    this.createModel();

    this.setupPhysics();
  }

  private createModel(): void {
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;

    this.model.add(body);

    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 2;
    head.castShadow = true;

    this.model.add(head);
  }

  private setupPhysics(): void {
    this.physics.addRigidbody(
      {
        shape: 'capsule',
        position: new THREE.Vector3(0, 1, 0),
        isStatic: false,
        mass: 1,
      },
      'player'
    );
  }

  update(deltaTime: number): void {
    const input = this.inputManager.getState();
    this.inputManager.update();

    this.updateMovement(input, deltaTime);
    this.updateCamera(input, deltaTime);
    this.updatePhysics(deltaTime);
  }

  private updateMovement(input: InputState, deltaTime: number): void {
    this.direction.set(
      (input.right ? 1 : 0) - (input.left ? 1 : 0),
      0,
      (input.backward ? 1 : 0) - (input.forward ? 1 : 0)
    );
    this.direction.normalize();

    const speed = this.config.moveSpeed * (input.run ? this.config.runSpeedMultiplier : 1);

    if (this.direction.length() > 0) {
      const moveVector = new THREE.Vector3();
      moveVector.x = this.direction.x * speed * deltaTime;
      moveVector.z = this.direction.z * speed * deltaTime;

      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.yaw);

      this.velocity.x = moveVector.x;
      this.velocity.z = moveVector.z;
    } else {
      this.velocity.x *= 0.1;
      this.velocity.z *= 0.1;
    }

    if (input.jump && this.isGrounded) {
      this.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
    }
  }

  private updateCamera(input: InputState, deltaTime: number): void {
    if (!input.mouse.deltaX && !input.mouse.deltaY) return;

    const sensitivity = this.inputManager.getMouseSensitivity();

    this.yaw -= input.mouse.deltaX * sensitivity * 100 * deltaTime;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch - input.mouse.deltaY * sensitivity * 100 * deltaTime));

    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  private updatePhysics(deltaTime: number): void {
    this.velocity.y += this.config.gravity * deltaTime;

    const body = this.physics.getBody('player');
    if (body) {
      body.velocity.copy(this.velocity);
      this.model.position.copy(body.position);
    }

    if (this.model.position.y <= 1) {
      this.model.position.y = 1;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.camera.position.set(
      this.model.position.x,
      this.model.position.y + 1.6,
      this.model.position.z
    );
  }

  public getPosition(): THREE.Vector3 {
    return this.model.position.clone();
  }

  public getRotation(): number {
    return this.yaw;
  }

  public setPosition(position: THREE.Vector3): void {
    this.model.position.copy(position);
    const body = this.physics.getBody('player');
    if (body) {
      body.position.copy(position);
    }
  }

  public setRotation(yaw: number): void {
    this.yaw = yaw;
  }

  public jump(): void {
    if (this.isGrounded) {
      this.velocity.y = this.config.jumpForce;
      this.isGrounded = false;
    }
  }

  public getIsGrounded(): boolean {
    return this.isGrounded;
  }
}