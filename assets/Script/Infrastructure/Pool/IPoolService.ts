/** Контракт пула нод. Позволяет переиспользовать cc.Node вместо создания и удаления. */
export interface IPoolService {
    acquire(prefab: cc.Prefab): cc.Node;
    release(node: cc.Node): void;
    preload(prefab: cc.Prefab, count: number): void;
    clear(): void;
}
