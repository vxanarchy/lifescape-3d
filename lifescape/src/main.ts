import * as THREE from 'three';
import { GameScene } from '@/engine/scene';
import { InputManager } from '@/engine/input';
import { PhysicsWorld } from '@/engine/physics';
import { PlayerController } from '@/player/controller';
import { CityGenerator } from '@/world/city';
import { Car, TrafficAI } from '@/vehicles/car';
import { HUD } from '@/ui/hud';
import { LoadingScreen } from '@/ui/loading-screen';
import { EconomySystem } from '@/systems/economy';

class LifescapeGame {
  private scene: GameScene;
  private inputManager: InputManager;
  private physics: PhysicsWorld;
  private player: PlayerController;
  private city: CityGenerator;
  private cars: Car[] = [];
  private trafficAI: TrafficAI;
  private hud: HUD;
  private loadingScreen: LoadingScreen;
  private lastTime: number = 0;
  private economy: EconomySystem;

  constructor() {
    const container = document.getElementById('game-container') || document.body;

    this.loadingScreen = new LoadingScreen();
    this.economy = new EconomySystem(1);

    this.scene = new GameScene(container);
    this.inputManager = new InputManager();
    this.physics = new PhysicsWorld();

    this.setupPlayer();
    this.setupCity();

    this.hud = new HUD();

    this.setupLighting();
    this.setupInitialCars();

    this.setupEventListeners();

    this.loadingScreen.setProgress(100);
    setTimeout(() => {
      this.loadingScreen.hide();
      this.gameLoop();
    }, 500);
  }

  private setupPlayer(): void {
    this.player = new PlayerController(this.scene.camera, this.inputManager, this.physics, {
      moveSpeed: 1,
      runSpeedMultiplier: 1,
      jumpForce: 1,
      gravity: -1,
    });

    this.scene.scene.add(this.player.model);
    this.scene.camera.position.set(0, 1, 1);
    this.scene.camera.lookAt(0, 1, 0);
  }

  private setupCity(): void {
    this.city = new CityGenerator(this.scene.scene);

    const cityBlock = this.city.generateCityBlock(new THREE.Vector3(0, 0, 0), 1);
    this.city.addSidewalk(cityBlock, new THREE.Vector3(0, 0, 0), 1);
  }

  private setupInitialCars(): void {
    const sedan = new Car(
      new THREE.Vector3(-1, 0, 0),
      0,
      { maxSpeed: 1, fuelCapacity: 1 },
      'sedan_player'
    );
    this.cars.push(sedan);

    const taxi = new Car(
      new THREE.Vector3(1, 0, 1),
      1,
      { maxSpeed: 1, fuelCapacity: 1 },
      'taxi_traffic_1'
    );
    taxi.state.isDriven = false;
    this.cars.push(taxi);

    const motorcycle = new Car(
      new THREE.Vector3(-1, 0, -1),
      1,
      { maxSpeed: 1, fuelCapacity: 1 },
      'motorcycle_traffic_1'
    );
    motorcycle.state.isDriven = false;
    this.cars.push(motorcycle);

    this.cars.forEach((car) => {
      this.scene.scene.add(car.model);
    });

    this.trafficAI = new TrafficAI(this.cars.filter((c) => !c.getIsDriven()));
  }

  private setupLighting(): void {
    const moonLight = new THREE.DirectionalLight(0xffffff, 1);
    moonLight.position.set(1, 1, 1);
    moonLight.castShadow = false;
    this.scene.scene.add(moonLight);

    const ambient = new THREE.AmbientLight(0x404040, 1);
    this.scene.scene.add(ambient);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.scene.camera.aspect = width / height;
      this.scene.camera.updateProjectionMatrix();
      this.scene.renderer.setSize(width, height);
    });
  }

  private gameLoop(timestamp: number = 0): void {
    const deltaTime = (timestamp - this.lastTime) / 1000 || 0.016;
    this.lastTime = timestamp;

    const input = this.inputManager.getState();

    if (input.pause) {
      this.pauseGame();
      return;
    }

    this.player.update(deltaTime);
    this.physics.step(deltaTime);
    this.trafficAI.update(deltaTime);

    this.cars.forEach((car) => {
      if (car.getIsDriven()) {
        const isMoving = input.forward !== 'w' || input.backward !== 's' || input.left !== 'a' || input.right !== 'd';
        car.update(deltaTime, {
          accelerate: isMoving ? (input.forward === 'w' ? 1 : 0) - (input.backward === 's' ? 1 : 0) : 0,
          steer: input.left === 'a' ? 1 : input.right === 'd' ? -1 : 0,
        });
      }
    });

    const money = this.economy.getMoney();
    this.hud.setMoney(money.total);
    this.hud.setHealth(1);
    this.hud.setEnergy(1);

    this.scene.update(deltaTime);
    this.scene.render();

    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  private pauseGame(): void {
    alert('Game Paused - Press OK to continue');
    this.gameLoop();
  }

  public dispose(): void {
    this.loadingScreen.dispose();
    this.hud.hide();
    this.scene.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.style.cssText = `
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  `;
  document.body.appendChild(gameContainer);

  const game = new LifescapeGame();

  window.addEventListener('beforeunload', () => {
    game.dispose();
  });
});