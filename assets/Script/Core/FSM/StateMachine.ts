import { IState } from './IState';

/** Конечный автомат. Хранит одно активное состояние и переключает его по имени. */
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
