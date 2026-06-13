import { ISuperTileEffect } from './ISuperTileEffect';

/** Реестр эффектов супертайлов. Регистрирует и отдаёт эффект по типу. */
export class SuperTileRegistry {
    private effects: Map<string, ISuperTileEffect> = new Map();

    register(effect: ISuperTileEffect): void {
        this.effects.set(effect.type, effect);
    }

    get(type: string): ISuperTileEffect | null {
        return this.effects.get(type) || null;
    }

    has(type: string): boolean {
        return this.effects.has(type);
    }
}
