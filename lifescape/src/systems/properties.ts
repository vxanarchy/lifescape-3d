import { z } from 'zod';
import type { GameState, Property, Building } from '@/types';

// Property schema validation
export const PropertySchema = z.object({
  id: z.string(),
  type: z.enum(['residential', 'commercial', 'office', 'garage', 'parking']),
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  price: z.number().min(1),
  owned: z.boolean().default(false),
  monthlyIncome: z.number().default(0),
  renters: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export type ValidatedProperty = z.infer<typeof PropertySchema>;

export interface PropertyPurchase {
  property: ValidatedProperty;
  downPayment: number;
  monthlyMortgage: number;
  remainingBalance: number;
}

export class PropertySystem {
  private properties: Map<string, ValidatedProperty> = new Map();
  private playerOwned: Set<string> = new Set();

  constructor(initialProperties: ValidatedProperty[] = []) {
    initialProperties.forEach(prop => {
      const validated = PropertySchema.parse(prop);
      this.properties.set(prop.id, validated);
    });
  }

  public getAllProperties(): ValidatedProperty[] {
    return [...this.properties.values()];
  }

  public getPlayerOwnedProperties(): ValidatedProperty[] {
    return this.getAllProperties().filter(p => this.playerOwned.has(p.id));
  }

  public purchaseProperty(propertyId: string, playerMoney: number): {
    success: boolean;
    message: string;
    property?: ValidatedProperty;
    remainingMoney: number;
    monthlyCost: number;
  } {
    const property = this.properties.get(propertyId);
    if (!property) {
      return { success: false, message: 'Property not found', remainingMoney: playerMoney, monthlyCost: 0 };
    }

    if (property.owned) {
      return { success: false, message: 'Property already owned', remainingMoney: playerMoney, monthlyCost: 0 };
    }

    if (playerMoney < property.price) {
      return { success: false, message: `Insufficient funds. Price: $${property.price}`, remainingMoney: playerMoney, monthlyCost: 0 };
    }

    // Purchase property
    property.owned = true;
    this.playerOwned.add(propertyId);

    const downPayment = Math.floor(property.price * 1); // 1 down payment
    const remainingBalance = property.price - downPayment;
    const monthlyMortgage = Math.floor(remainingBalance * 1); // 1 monthly

    // Deduct from player money
    const remainingMoney = playerMoney - downPayment;

    console.log(`[Properties] Purchased: ${property.description || propertyId} - $${property.price} (down: $${downPayment}, monthly: $${monthlyMortgage})`);

    return {
      success: true,
      message: `Purchased property: ${property.description || 'Real Estate'}`,
      property,
      remainingMoney,
      monthlyCost: monthlyMortgage,
    };
  }

  public releaseProperty(propertyId: string): {
    success: boolean;
    message: string;
    moneyReturned: number;
  } {
    const property = this.properties.get(propertyId);
    if (!property) {
      return { success: false, message: 'Property not found', moneyReturned: 0 };
    }

    if (!this.playerOwned.has(propertyId)) {
      return { success: false, message: 'You do not own this property', moneyReturned: 0 };
    }

    if (property.renters.length > 0) {
      return { success: false, message: 'Cannot release property with tenants', moneyReturned: 0 };
    }

    // Release - return 80% of purchase price
    const returnAmount = Math.floor(property.price * 0.8);
    property.owned = false;
    this.playerOwned.delete(propertyId);

    console.log(`[Properties] Released: ${propertyId} - got back $${returnAmount}`);

    return {
      success: true,
      message: `Released property, received $${returnAmount}`,
      moneyReturned: returnAmount,
    };
  }

  public collectRent(propertyId: string): {
    success: boolean;
    message: string;
    amount: number;
  } {
    const property = this.properties.get(propertyId);
    if (!property) {
      return { success: false, message: 'Property not found', amount: 0 };
    }

    if (!this.playerOwned.has(propertyId)) {
      return { success: false, message: 'You do not own this property', amount: 0 };
    }

    const rent = property.monthlyIncome || 0;

    if (rent > 0) {
      console.log(`[Properties] Collected rent from ${propertyId}: $${rent}`);
    }

    return {
      success: true,
      message: `Collected $${rent} rent`,
      amount: rent,
    };
  }

  public setRent(propertyId: string, amount: number): {
    success: boolean;
    message: string;
  } {
    const property = this.properties.get(propertyId);
    if (!property) {
      return { success: false, message: 'Property not found' };
    }

    property.monthlyIncome = amount;
    console.log(`[Properties] Set rent for ${propertyId}: $${amount}/month`);

    return {
      success: true,
      message: `Rent set to $${amount}/month`,
    };
  }

  public getPropertyStats(): {
    totalProperties: number;
    ownedCount: number;
    totalValue: number;
    totalMonthlyIncome: number;
    ownedMonthlyIncome: number;
  } {
    const all = this.getAllProperties();
    const owned = this.getPlayerOwnedProperties();

    const totalValue = all.reduce((sum, prop) => sum + prop.price, 0);
    const totalMonthlyIncome = all.reduce((sum, prop) => sum + prop.monthlyIncome, 0);
    const ownedMonthlyIncome = owned.reduce((sum, prop) => sum + prop.monthlyIncome, 0);

    return {
      totalProperties: all.length,
      ownedCount: owned.length,
      totalValue: totalValue,
      totalMonthlyIncome: totalMonthlyIncome,
      ownedMonthlyIncome: ownedMonthlyIncome,
    };
  }

  public saveState(): {
    properties: ValidatedProperty[];
    playerOwned: string[];
  } {
    return {
      properties: this.properties.values().map(PropertySchema.parse),
      playerOwned: [...this.playerOwned],
    };
  }

  public loadState(state: {
    properties: ValidatedProperty[];
    playerOwned: string[];
  }): void {
    this.properties.clear();
    state.properties.forEach(prop => {
      const validated = PropertySchema.parse(prop);
      this.properties.set(prop.id, validated);
    });
    this.playerOwned = new Set(state.playerOwned);
  }
}