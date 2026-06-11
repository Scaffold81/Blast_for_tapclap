const { ccclass, property } = cc._decorator;

@ccclass('TileSpriteRecord')
export class TileSpriteRecord {
    @property(cc.String)
    id: string = '';

    @property(cc.SpriteFrame)
    spriteFrame: cc.SpriteFrame = null;
}

@ccclass('TileSpriteConfig')
export class TileSpriteConfig extends cc.Component {

    @property(TileSpriteRecord)
    tiles: TileSpriteRecord[] = [];

    @property(cc.SpriteFrame)
    superRow: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    superCol: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    superBomb: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    superMax: cc.SpriteFrame = null;

    getRecord(id: string): TileSpriteRecord | null {
        return this.tiles.find(r => r.id === id) ?? null;
    }
}
