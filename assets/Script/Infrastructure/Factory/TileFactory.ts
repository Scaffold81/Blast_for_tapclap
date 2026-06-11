import { ITileFactory }          from './ITileFactory';
import { TileModel }             from '../../Domain/Models/TileModel';
import { TileType, SuperTileType } from '../../Domain/Models/TileType';
import { IPoolService }          from '../Pool/IPoolService';
import { ISpriteConfigService }  from '../Sprite/ISpriteConfigService';

/** Создаёт TileModel и cc.Node для тайла. Использует пул нод и сервис спрайтов. */
export class TileFactory implements ITileFactory {

    constructor(
        private pool:    IPoolService,
        private sprites: ISpriteConfigService,
        private prefab:  cc.Prefab,
    ) {}

    createModel(row: number, col: number, type: TileType, superType: SuperTileType = SuperTileType.None): TileModel {
        return new TileModel(row, col, type, superType);
    }

    createView(model: TileModel, parent: cc.Node): cc.Node {
        const node    = this.pool.acquire(this.prefab);
        const sprite  = node.getComponent(cc.Sprite);

        if (sprite) {
            const frame = model.isSuper
                ? this.sprites.getSuperSprite(model.superType)
                : this.sprites.getSprite(model.type);

            if (frame) sprite.spriteFrame = frame;
        }

        node.parent = parent;
        return node;
    }

    releaseView(node: cc.Node): void {
        this.pool.release(node);
    }
}
