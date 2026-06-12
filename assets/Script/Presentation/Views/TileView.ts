import { TileModel }             from '../../Domain/Models/TileModel';
import { ISpriteConfigService }  from '../../Infrastructure/Sprite/ISpriteConfigService';

const { ccclass } = cc._decorator;

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

    playSpawn(): Promise<void> {
        return new Promise(resolve => {
            this.node.scale = 0;
            cc.tween(this.node)
                .to(0.2, { scale: 1 }, { easing: 'backOut' })
                .call(() => resolve())
                .start();
        });
    }

    playBlast(): Promise<void> {
        return new Promise(resolve => {
            cc.tween(this.node)
                .to(0.15, { scale: 0 }, { easing: 'backIn' })
                .call(() => resolve())
                .start();
        });
    }

    playFall(toY: number): Promise<void> {
        return new Promise(resolve => {
            cc.tween(this.node)
                .to(0.2, { y: toY }, { easing: 'quadIn' })
                .call(() => resolve())
                .start();
        });
    }
}
