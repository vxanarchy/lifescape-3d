import * as THREE from 'three';

export class GameScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public clock: THREE.Clock;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    const aspectRatio = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.clock = new THREE.Clock();

    this.setupLights();
    container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => this.onWindowResize(container));
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(directionalLight);
  }

  private onWindowResize(container: HTMLElement): void {
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  public update(deltaTime: number): void {
    // Called each frame for scene-wide updates
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
  }
}