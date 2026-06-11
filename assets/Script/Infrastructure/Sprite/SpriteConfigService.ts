import { TileType, SuperTileType }  from '../../Domain/Models/TileType';
import { ISpriteConfigService }      from './ISpriteConfigService';
import { TileSpriteConfig }          from '../../Config/TileSpriteConfig';

/** Читает спрайты из TileSpriteConfig — cc.Component, настраиваемого в редакторе. */
export class SpriteConfigService implements ISpriteConfigService {

    constructor(private config: TileSpriteConfig) {}

    getSprite(type: TileType): cc.SpriteFrame | null {
        const record = this.config.getRecord(type);
        return record ? record.spriteFrame : null;
    }

    getSuperSprite(superType: SuperTileType): cc.SpriteFrame | null {
        switch (superType) {
            case SuperTileType.Row:  return this.config.superRow;
            case SuperTileType.Col:  return this.config.superCol;
            case SuperTileType.Bomb: return this.config.superBomb;
            case SuperTileType.Max:  return this.config.superMax;
            default:                 return null;
        }
    }

    hasSprite(type: TileType): boolean {
        return this.config.getRecord(type) !== null;
    }
}
