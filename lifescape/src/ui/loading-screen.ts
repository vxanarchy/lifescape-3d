import * as THREE from 'three';

export class LoadingScreen {
  private overlay: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private progressText: HTMLDivElement;

  constructor() {
    this.createOverlay();
    this.show();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: Arial, sans-serif;
    `;

    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 300px;
      height: 8px;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
      margin: 20px 0;
    `;

    const fill = document.createElement('div');
    fill.id = 'progress-fill';
    fill.style.cssText = `
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #00d9ff, #00ff88);
      transition: width 0.3s ease;
    `;
    this.progressBar.appendChild(fill);

    this.progressText = document.createElement('div');
    this.progressText.style.cssText = `
      color: #fff;
      font-size: 14px;
      margin-top: 10px;
    `;

    const title = document.createElement('h1');
    title.style.cssText = `
      color: #fff;
      font-size: 32px;
      margin: 0 0 20px 0;
      font-family: 'Arial', sans-serif;
      text-align: center;
    `;
    title.textContent = 'LIFEVERSE 3D';

    const subtitle = document.createElement('p');
    subtitle.style.cssText = `
      color: #888;
      font-size: 14px;
      margin: 10px 0 0 0;
    `;
    subtitle.textContent = 'Loading City... Please wait';

    this.overlay.appendChild(title);
    this.overlay.appendChild(subtitle);
    this.overlay.appendChild(this.progressBar);
    this.overlay.appendChild(this.progressText);
    document.body.appendChild(this.overlay);
  }

  public show(): void {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
    }
  }

  public hide(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  public setProgress(progress: number): void {
    const fill = document.getElementById('progress-fill') || this.progressBar.querySelector('div');
    if (fill) {
      fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    this.progressText.textContent = `Loading... ${Math.round(progress)}%`;
  }

  public dispose(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}