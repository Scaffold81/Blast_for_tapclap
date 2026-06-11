import { IState } from './IState';

/**
 * Конечный автомат. Знает только одно состояние за раз — текущее.
 * При переключении вызывает exit() у старого и enter() у нового.
 * Не знает ничего об игровой логике — просто переключает состояния по команде.
 */
export class StateMachine {
    private current:     IState | null = null;
    private currentName: string | null = null;
    private states:      Map<string, IState> = new Map();

    register(name: string, state: IState): void {
        this.states.set(name, state);
    }

    enter(name: string): void {
        const next = this.states.get(name);

        if (!next) {
            throw new Error(`[StateMachine] Состояние не найдено: ${name}`);
        }

        if (this.currentName === name) {
            return;
        }

        this.current?.exit();
        this.current     = next;
        this.currentName = name;
        this.current.enter();
    }

    getCurrentName(): string | null {
        return this.currentName;
    }

    is(name: string): boolean {
        return this.currentName === name;
    }
}
