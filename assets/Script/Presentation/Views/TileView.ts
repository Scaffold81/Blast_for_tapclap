import { TileModel }            from '../../Domain/Models/TileModel';
import { TileType, SuperTileType } from '../../Domain/Models/TileType';
import { ISpriteConfigService } from '../../Infrastructure/Sprite/ISpriteConfigService';

const { ccclass } = cc._decorator;

const FALL_DURATION  = 0.3;
const SPAWN_DURATION = 0.2;
const BLAST_DURATION = 0.15;
const PRESS_SCALE    = 1.1;
const PRESS_DURATION = 0.08;
const NONE_SUPER     = 'none' as SuperTileType;

/** Визуальное представление одного тайла. Хранит тип явно и сам управляет спрайтом. */
@ccclass
export class TileView extends cc.Component {

    private sprites:    ISpriteConfigService;
    private sprite:     cc.Sprite;
    private _tileType:  TileType;
    private _superType: SuperTileType;

    row: number = 0;
    col: number = 0;

    init(model: TileModel, sprites: ISpriteConfigService): void {
        this.sprites    = sprites;
        this.row        = model.row;
        this.col        = model.col;
        this._tileType  = model.type;
        this._superType = model.superType;
        this.sprite     = this.getComponent(cc.Sprite);
        this.node.scale = 1;
        this.applySprite();
    }

    setType(tileType: TileType, superType: SuperTileType): void {
        this._tileType  = tileType;
        this._superType = superType;
        this.applySprite();
    }

    updateSprite(): void {
        this.applySprite();
    }

    private applySprite(): void {
        if (!this.sprite || !this.sprites) return;
        const isSuper = this._superType !== NONE_SUPER;
        const frame   = isSuper
            ? this.sprites.getSuperSprite(this._superType)
            : this.sprites.getSprite(this._tileType);
        if (frame) this.sprite.spriteFrame = frame;
    }

    moveTo(row: number, col: number): void {
        this.row = row;
        this.col = col;
    }

    playPress(): void {
        cc.Tween.stopAllByTarget(this.node);
        cc.tween(this.node)
            .to(PRESS_DURATION, { scale: PRESS_SCALE }, { easing: 'quadOut' })
            .start();
    }

    playRelease(): void {
        cc.Tween.stopAllByTarget(this.node);
        cc.tween(this.node)
            .to(PRESS_DURATION, { scale: 1.0 }, { easing: 'backOut' })
            .start();
    }

    playSpawn(delay: number = 0): Promise<void> {
        return new Promise(resolve => {
            this.node.scale = 0;
            cc.tween(this.node)
                .delay(delay)
                .to(SPAWN_DURATION, { scale: 1 }, { easing: 'backOut' })
                .call(() => resolve())
                .start();
        });
    }

    playBlast(): Promise<void> {
        return new Promise(resolve => {
            cc.tween(this.node)
                .to(BLAST_DURATION, { scale: 0 }, { easing: 'backIn' })
                .call(() => resolve())
                .start();
        });
    }

    playFall(toY: number, delay: number = 0): Promise<void> {
        return new Promise(resolve => {
            cc.tween(this.node)
                .delay(delay)
                .to(FALL_DURATION, { y: toY }, { easing: 'quadIn' })
                .call(() => resolve())
                .start();
        });
    }
}
