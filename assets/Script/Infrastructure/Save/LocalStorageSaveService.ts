import { ISaveService } from './ISaveService';

/** Сохранение данных через localStorage. Сериализует значения в JSON. */
export class LocalStorageSaveService implements ISaveService {

    save<T>(key: string, value: T): void {
        try {
            cc.sys.localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            cc.warn(`[SaveService] Не удалось сохранить "${key}": ${e.message}`);
        }
    }

    load<T>(key: string): T | null {
        try {
            const raw = cc.sys.localStorage.getItem(key);
            if (raw === null || raw === undefined) return null;
            return JSON.parse(raw) as T;
        } catch (e) {
            cc.warn(`[SaveService] Не удалось загрузить "${key}": ${e.message}`);
            return null;
        }
    }

    has(key: string): boolean {
        const raw = cc.sys.localStorage.getItem(key);
        return raw !== null && raw !== undefined;
    }

    remove(key: string): void {
        cc.sys.localStorage.removeItem(key);
    }

    clear(): void {
        cc.sys.localStorage.clear();
    }
}
