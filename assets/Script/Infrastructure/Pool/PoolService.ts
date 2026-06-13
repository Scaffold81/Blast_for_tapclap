import { IPoolService } from './IPoolService';

/** Пул нод на основе cc.NodePool. Хранит отдельный пул для каждого префаба. */
export class PoolService implements IPoolService {

    private pools: Map<string, cc.NodePool> = new Map();

    acquire(prefab: cc.Prefab): cc.Node {
        const pool = this.getOrCreate(prefab);
        if (pool.size() > 0) {
            return pool.get();
        }
        return cc.instantiate(prefab);
    }

    release(node: cc.Node): void {
        const key  = node.name;
        const pool = this.pools.get(key);
        if (pool) {
            pool.put(node);
        } else {
            node.destroy();
        }
    }

    preload(prefab: cc.Prefab, count: number): void {
        const pool = this.getOrCreate(prefab);
        for (let i = 0; i < count; i++) {
            pool.put(cc.instantiate(prefab));
        }
    }

    clear(): void {
        this.pools.forEach(pool => pool.clear(true));
        this.pools.clear();
    }

    private getOrCreate(prefab: cc.Prefab): cc.NodePool {
        const key = prefab.name;
        if (!this.pools.has(key)) {
            this.pools.set(key, new cc.NodePool());
        }
        return this.pools.get(key)!;
    }
}
