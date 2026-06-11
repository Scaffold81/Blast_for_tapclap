import { GameEventKey, GameEventMap } from './GameEvents';

type Handler<T> = T extends void ? () => void : (data: T) => void;

/**
 * Почтовое отделение игры. Кто хочет знать — подписывается, кто хочет сказать — стреляет.
 * Все друг друга знают, но делают вид что не знают. Слабая связь, как и положено воспитанным людям.
 * Типизирован — случайный мусор в событие не пролезет, компилятор не пустит.
 */
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

    /** Снять все подписки одним движением — незаменимо в onDestroy, чтобы не кормить призраков */
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

    /** Ядерная кнопка — сносит все подписки. Рестарт, сцена умерла, всё такое */
    clear(): void {
        this.handlers.clear();
    }
}

/**
 * Один на всю игру — и это осознанный выбор, не лень.
 * Можно было бы завести отдельные шины для UI, логики, бустеров — и в большом проекте так и надо.
 * Но здесь события уже разделены префиксами: 'game:', 'blast:', 'ui:', 'booster:' —
 * префикс и есть логическая шина. Плодить экземпляры сверху было бы нарушением YAGNI
 * и усложнило бы DI без какой-либо реальной пользы.
 * Если проект вырастет до нескольких сцен одновременно — вот тогда и поговорим.
 */
export const eventBus = new EventBus();
