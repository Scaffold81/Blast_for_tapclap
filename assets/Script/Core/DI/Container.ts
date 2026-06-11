import { TypeKey } from './Types';

enum Lifetime {
    Singleton = 'Singleton',
    Transient = 'Transient',
}

interface Binding<T> {
    lifetime: Lifetime;
    factory:  () => T;
    instance: T | null;
}

export class BindingBuilder<T> {
    private binding: Binding<T>;

    constructor(binding: Binding<T>) {
        this.binding = binding;
    }

    toTransient(): void {
        this.binding.lifetime = Lifetime.Transient;
    }
}

/** DI-контейнер. Регистрирует зависимости по токену и отдаёт их по запросу. Поддерживает Singleton и Transient. */
export class Container {
    private bindings: Map<symbol, Binding<any>> = new Map();

    bind<T>(token: TypeKey, factory: () => T): BindingBuilder<T> {
        const binding: Binding<T> = {
            lifetime: Lifetime.Singleton,
            factory,
            instance: null,
        };
        this.bindings.set(token as symbol, binding);
        return new BindingBuilder<T>(binding);
    }

    bindInterfaceTo<T>(token: TypeKey, factory: () => T): BindingBuilder<T> {
        return this.bind<T>(token, factory);
    }

    bindValue<T>(token: TypeKey, value: T): void {
        const binding: Binding<T> = {
            lifetime: Lifetime.Singleton,
            factory:  () => value,
            instance: value,
        };
        this.bindings.set(token as symbol, binding);
    }

    get<T>(token: TypeKey): T {
        const binding = this.bindings.get(token as symbol) as Binding<T> | undefined;

        if (!binding) {
            throw new Error(`[Container] Зависимость не найдена для токена: ${String(token)}`);
        }

        if (binding.lifetime === Lifetime.Singleton) {
            if (binding.instance === null) {
                binding.instance = binding.factory();
            }
            return binding.instance;
        }

        return binding.factory();
    }

    has(token: TypeKey): boolean {
        return this.bindings.has(token as symbol);
    }

    unbind(token: TypeKey): void {
        this.bindings.delete(token as symbol);
    }

    clear(): void {
        this.bindings.clear();
    }
}

/** Глобальный экземпляр контейнера на всю игру. */
export const container = new Container();
