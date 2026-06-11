/** Контракт сервиса сохранения. Позволяет подменить реализацию не меняя остальной код. */
export interface ISaveService {
    save<T>(key: string, value: T): void;
    load<T>(key: string): T | null;
    has(key: string): boolean;
    remove(key: string): void;
    clear(): void;
}
