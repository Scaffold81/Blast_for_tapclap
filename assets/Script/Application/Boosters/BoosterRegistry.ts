import { IBooster } from './IBooster';

/** Реестр бустеров. Регистрирует и отдаёт бустер по типу. */
export class BoosterRegistry {
    private boosters: Map<string, IBooster> = new Map();

    register(booster: IBooster): void {
        this.boosters.set(booster.type, booster);
    }

    get(type: string): IBooster | null {
        return this.boosters.get(type) || null;
    }

    has(type: string): boolean {
        return this.boosters.has(type);
    }
}
