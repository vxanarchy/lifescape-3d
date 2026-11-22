import * as THREE from 'three';

export interface CarConfig {
  mass: number;
  maxSpeed: number;
  acceleration: number;
  braking: number;
  turningSpeed: number;
  fuelCapacity: number;
}

export interface VehicleState {
  position: THREE.Vector3;
  rotation: number;
  velocity: THREE.Vector3;
  angularVelocity: number;
  fuel: number;
  isDriven: boolean;
  health: number;
}

export class Car {
  public model: THREE.Group;
  private config: CarConfig;
  public state: VehicleState;
  private id: string;

  constructor(
    position: THREE.Vector3,
    rotation: number = 0,
    config: Partial<CarConfig> = {},
    carId: string = `car_${Math.random().toString(36).substr(2, 9)}`
  ) {
    this.config = {
      mass: 1500,
      maxSpeed: 30,
      acceleration: 10,
      braking: 15,
      turningSpeed: 3,
      fuelCapacity: 50,
      ...config,
    };

    this.id = carId;
    this.state = {
      position: position.clone(),
      rotation,
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: 0,
      fuel: this.config.fuelCapacity,
      isDriven: false,
      health: 100,
    };

    this.createModel();
  }

  private createModel(): void {
    this.model = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 1.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    this.model.add(body);

    const cabinGeometry = new THREE.BoxGeometry(2.5, 1, 1.2);
    const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
    cabin.position.y = 0.8;
    cabin.castShadow = true;
    this.model.add(cabin);

    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const wheelPositions = [
      [-1, -0.7, 0.9],
      [1, -0.7, 0.9],
      [-1, -0.7, -0.9],
      [1, -0.7, -0.9],
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(...pos as [number, number, number]);
      wheel.castShadow = true;
      this.model.add(wheel);
    });

    this.model.position.copy(this.state.position);
    this.model.rotation.y = this.state.rotation;
  }

  public update(deltaTime: number, input: { accelerate: number; steer: number } = { accelerate: 0, steer: 0 }): void {
    if (this.state.fuel <= 0) {
      this.brake(deltaTime);
      return;
    }

    this.applyEngine(input.accelerate, deltaTime);
    this.applySteering(input.steer, deltaTime);
    this.applyBraking(input.accelerate, deltaTime);
    this.applyPhysics(deltaTime);
    this.consumeFuel(deltaTime);

    this.model.position.copy(this.state.position);
    this.model.rotation.y = this.state.rotation;
  }

  private applyEngine(accel: number, deltaTime: number): void {
    if (accel > 0) {
      const targetSpeed = this.config.maxSpeed * accel;
      const currentSpeed = this.state.velocity.length();

      if (currentSpeed < targetSpeed) {
        const acceleration = this.config.acceleration * accel * deltaTime;
        const forward = new THREE.Vector3(
          Math.sin(this.state.rotation),
          0,
          Math.cos(this.state.rotation)
        );
        this.state.velocity.addScaledVector(forward, acceleration);
      }
    }
  }

  private applySteering(steer: number, deltaTime: number): void {
    if (Math.abs(steer) > 0.01 && this.state.velocity.length() > 1) {
      const turnAmount = steer * this.config.turningSpeed * deltaTime;
      this.state.rotation += turnAmount * (this.state.velocity.length() / this.config.maxSpeed);
    }
  }

  private applyBraking(accel: number, deltaTime: number): void {
    if (accel < 0) {
      const brakeForce = this.config.braking * Math.abs(accel) * deltaTime;
      this.state.velocity.multiplyScalar(1 - brakeForce * deltaTime);
    }
  }

  private brake(deltaTime: number): void {
    const brakeForce = this.config.braking * deltaTime;
    this.state.velocity.multiplyScalar(1 - brakeForce);
  }

  private applyPhysics(deltaTime: number): void {
    const friction = 0.98;
    this.state.velocity.multiplyScalar(friction);

    this.state.position.addScaledVector(this.state.velocity, deltaTime);
  }

  private consumeFuel(deltaTime: number): void {
    if (this.state.velocity.length() > 0) {
      this.state.fuel = Math.max(0, this.state.fuel - 0.05 * this.state.velocity.length() * deltaTime);
    }
  }

  public stop(): void {
    this.state.velocity.set(0, 0, 0);
    this.state.angularVelocity = 0;
  }

  public getPosition(): THREE.Vector3 {
    return this.state.position.clone();
  }

  public getRotation(): number {
    return this.state.rotation;
  }

  public getId(): string {
    return this.id;
  }

  public getIsDriven(): boolean {
    return this.state.isDriven;
  }

  public setIsDriven(drive: boolean): void {
    this.state.isDriven = drive;
  }

  public getFuel(): number {
    return this.state.fuel;
  }

  public setFuel(amount: number): void {
    this.state.fuel = Math.max(0, Math.min(this.config.fuelCapacity, amount));
  }
}

export class TrafficAI {
  private cars: Car[] = [];
  private waypoints: THREE.Vector3[] = [];

  constructor(cars: Car[]) {
    this.cars = cars;
    this.generateWaypoints();
  }

  private generateWaypoints(): void {
    this.waypoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(50, 0, 0),
      new THREE.Vector3(50, 0, 50),
      new THREE.Vector3(0, 0, 50),
      new THREE.Vector3(0, 0, 0),
    ];
  }

  public update(deltaTime: number): void {
    this.cars.forEach((car) => {
      if (!car.getIsDriven()) {
        const trafficInput = this.getTrafficInput(car);
        car.update(deltaTime, trafficInput);
      }
    });
  }

  private getTrafficInput(car: Car): { accelerate: number; steer: number } {
    const pos = car.getPosition();
    const rotation = car.getRotation();

    let targetWaypoint = 0;
    for (let i = 0; i < this.waypoints.length; i++) {
      const distance = pos.distanceTo(this.waypoints[i]);
      if (distance < 5) {
        targetWaypoint = i;
        break;
      }
    }

    const nextWaypoint = this.waypoints[(targetWaypoint + 1) % this.waypoints.length];
    const toTarget = new THREE.Vector3().subVectors(nextWaypoint, pos);

    const forward = new THREE.Vector3(
      Math.sin(rotation),
      0,
      Math.cos(rotation)
    );

    const dot = forward.dot(toTarget.normalize());
    const cross = forward.cross(toTarget.normalize());

    return {
      accelerate: Math.max(0, dot),
      steer: -cross.z * 0.5,
    };
  }
}