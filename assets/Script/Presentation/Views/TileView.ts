import { TileModel }             from '../../Domain/Models/TileModel';
import { ISpriteConfigService }  from '../../Infrastructure/Sprite/ISpriteConfigService';

const { ccclass } = cc._decorator;

const FALL_DURATION  = 0.3;
const SPAWN_DURATION = 0.2;
const BLAST_DURATION = 0.15;

/** Визуальное представление одного тайла. Знает свою текущую позицию на сетке. */
@ccclass
export class TileView extends cc.Component {

    private model:   TileModel;
    private sprites: ISpriteConfigService;
    private sprite:  cc.Sprite;

    row: number = 0;
    col: number = 0;

    init(model: TileModel, sprites: ISpriteConfigService): void {
        this.model   = model;
        this.sprites = sprites;
        this.row     = model.row;
        this.col     = model.col;
        this.sprite  = this.getComponent(cc.Sprite);
        this.updateSprite();
    }

    updateSprite(): void {
        if (!this.sprite) return;

        const frame = this.model.isSuper
            ? this.sprites.getSuperSprite(this.model.superType)
            : this.sprites.getSprite(this.model.type);

        if (frame) this.sprite.spriteFrame = frame;
    }

    moveTo(row: number, col: number): void {
        this.row = row;
        this.col = col;
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
