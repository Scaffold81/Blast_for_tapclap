type Handler<T> = T extends void ? () => void : (data: T) => void;

/** Типизированная generic шина событий. Не зависит от конкретных событий игры. */
export class EventBus<TMap extends Record<string, any>> {
    private handlers: Map<string, Set<Function>> = new Map();

    on<K extends keyof TMap>(event: K, handler: Handler<TMap[K]>): void {
        const key = event as string;
        if (!this.handlers.has(key)) {
            this.handlers.set(key, new Set());
        }
        this.handlers.get(key)!.add(handler);
    }

    off<K extends keyof TMap>(event: K, handler: Handler<TMap[K]>): void {
        this.handlers.get(event as string)?.delete(handler);
    }

    offAll(handler: Function): void {
        this.handlers.forEach(set => set.delete(handler));
    }

    emit<K extends keyof TMap>(
        event: K,
        ...args: TMap[K] extends void ? [] : [TMap[K]]
    ): void {
        this.handlers.get(event as string)?.forEach(h => h(...args));
    }

    once<K extends keyof TMap>(event: K, handler: Handler<TMap[K]>): void {
        const wrapper = (...args: any[]) => {
            (handler as Function)(...args);
            this.off(event, wrapper as any);
        };
        this.on(event, wrapper as any);
    }

    clear(): void {
        this.handlers.clear();
    }
}

// Реэкспорт для обратной совместимости — все старые импорты продолжают работать
export { eventBus } from './GameEventBus';
