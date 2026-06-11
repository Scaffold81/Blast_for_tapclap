import { TileType, SuperTileType } from '../../Domain/Models/TileType';

/** Контракт сервиса доступа к спрайтам тайлов. TileView не знает откуда берётся спрайт. */
export interface ISpriteConfigService {
    getSprite(type: TileType): cc.SpriteFrame | null;
    getSuperSprite(superType: SuperTileType): cc.SpriteFrame | null;
    hasSprite(type: TileType): boolean;
}
