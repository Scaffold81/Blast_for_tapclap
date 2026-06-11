import { GameEventKey, GameEventMap } from './GameEvents';

type Handler<T> = T extends void ? () => void : (data: T) => void;

/** Типизированная шина событий. Связывает слои игры без прямых зависимостей друг от друга. */
export class EventBus {
    private handlers: Map<string, Set<Function>> = new Map();

    on<K extends GameEventKey>(event: K, handler: Handler<GameEventMap[K]>): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);
    }

    off<K extends GameEventKey>(event: K, handler: Handler<GameEventMap[K]>): void {
        this.handlers.get(event)?.delete(handler);
    }

    /** Снимает все подписки одного хендлера сразу — удобно вызывать в onDestroy. */
    offAll(handler: Function): void {
        this.handlers.forEach(set => set.delete(handler));
    }

    emit<K extends GameEventKey>(
        event: K,
        ...args: GameEventMap[K] extends void ? [] : [GameEventMap[K]]
    ): void {
        this.handlers.get(event)?.forEach(h => h(...args));
    }

    once<K extends GameEventKey>(event: K, handler: Handler<GameEventMap[K]>): void {
        const wrapper = (...args: any[]) => {
            (handler as Function)(...args);
            this.off(event, wrapper as any);
        };
        this.on(event, wrapper as any);
    }

    /** Сбрасывает все подписки. */
    clear(): void {
        this.handlers.clear();
    }
}

/** Глобальный экземпляр шины событий на всю игру. */
export const eventBus = new EventBus();
