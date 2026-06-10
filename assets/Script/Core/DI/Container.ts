import { TypeKey } from './Types';

// Свой мини-Zenject для Cocos. Без рефлексии, без магии — просто Map и фабрики. 
// Привык я к нему.хотя судя по форумам в кокосе не сильно любят DI но я могу ошибаться.В любом случае, если тебе нужно что - то более сложное, чем просто глобальный объект, то вот тебе контейнер.Он поддерживает синглтоны и транзиенты, а также позволяет привязывать интерфейсы к конкретным реализациям. 
// И да, он не использует декораторы или рефлексию, так что все должно работать в любом окружении. Единственный минус это Types
// Только IDE сильно умной стала, за меня комментарии пишет.

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

// Один на всю игру. По хорошему три должно быть слоя контейнеров: глобальный, сценовый и локальный. Но для простоты я сделал один. Если тебе нужно что-то более сложное, ты всегда можешь создать свои контейнеры и использовать их внутри своих классов.
// Опять IDE за меня дописала комментарий
export const container = new Container();
