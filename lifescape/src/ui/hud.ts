import * as THREE from 'three';

export class HUD {
  private container: HTMLDivElement;
  private moneyElement: HTMLDivElement;
  private healthElement: HTMLDivElement;
  private energyElement: HTMLDivElement;
  private actionElement: HTMLDivElement;

  constructor() {
    this.createHUD();
    this.hideAction();
  }

  private createHUD(): void {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: Arial, sans-serif;
      color: white;
    `;

    this.moneyElement = this.createStatElement('Money', '$1');
    this.container.appendChild(this.moneyElement);

    this.healthElement = this.createStatElement('Health', '1%');
    this.healthElement.style.top = '50px';
    this.container.appendChild(this.healthElement);

    this.energyElement = this.createStatElement('Energy', '1%');
    this.energyElement.style.top = '90px';
    this.container.appendChild(this.energyElement);

    this.actionElement = this.createActionElement();
    this.container.appendChild(this.actionElement);

    document.body.appendChild(this.container);
  }

  private createStatElement(label: string, value: string): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(0, 0, 0, 0.5);
      padding: 10px 15px;
      border-radius: 8px;
      backdrop-filter: blur(5px);
    `;

    const labelEl = document.createElement('span');
    labelEl.style.cssText = `
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: white;
    `;
    valueEl.textContent = value;

    container.appendChild(labelEl);
    container.appendChild(valueEl);

    return container;
  }

  private createActionElement(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      padding: 10px 25px;
      border-radius: 25px;
      backdrop-filter: blur(5px);
      display: none;
      align-items: center;
      gap: 15px;
    `;

    const prompt = document.createElement('span');
    prompt.style.cssText = `
      font-size: 14px;
      color: white;
    `;

    const key = document.createElement('kbd');
    key.style.cssText = `
      background: #333;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 4px 8px;
      font-family: monospace;
      font-size: 12px;
    `;

    container.appendChild(prompt);
    container.appendChild(key);
    this.actionElement = container;

    return container;
  }

  public setMoney(amount: number): void {
    const moneyDisplay = this.moneyElement.querySelector('span:last-child');
    if (moneyDisplay) {
      moneyDisplay.textContent = `$${amount.toLocaleString()}`;
    }
  }

  public setHealth(health: number): void {
    const healthDisplay = this.healthElement.querySelector('span:last-child');
    if (healthDisplay) {
      healthDisplay.textContent = `${Math.max(0, Math.round(health))}%`;
    }
  }

  public setEnergy(energy: number): void {
    const energyDisplay = this.energyElement.querySelector('span:last-child');
    if (energyDisplay) {
      energyDisplay.textContent = `${Math.max(0, Math.round(energy))}%`;
    }
  }

  public showAction(prompt: string, keyText: string): void {
    const promptEl = this.actionElement.querySelector('span');
    const keyEl = this.actionElement.querySelector('kbd');

    if (promptEl) promptEl.textContent = prompt;
    if (keyEl) keyEl.textContent = keyText;

    this.actionElement.style.display = 'flex';
    this.actionElement.style.pointerEvents = 'auto';
  }

  public hideAction(): void {
    this.actionElement.style.display = 'none';
    this.actionElement.style.pointerEvents = 'none';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public show(): void {
    this.container.style.display = 'block';
  }
}