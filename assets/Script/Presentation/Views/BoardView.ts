import { TileView }              from './TileView';
import { TileModel }             from '../../Domain/Models/TileModel';
import { BoardModel }            from '../../Domain/Models/BoardModel';
import { ISpriteConfigService }  from '../../Infrastructure/Sprite/ISpriteConfigService';
import { IBoardConfig }          from '../../Config/BoardConfig';
import { FallChange }            from '../../Domain/Logic/FallLogic';
import { eventBus }              from '../../Core/Events/EventBus';

const { ccclass, property } = cc._decorator;

/** Визуальное представление игрового поля. Создаёт и позиционирует TileView, реагирует на игровые события. */
@ccclass
export class BoardView extends cc.Component {

    @property(cc.Prefab)
    tilePrefab: cc.Prefab = null;

    private views:   Map<string, TileView> = new Map();
    private sprites: ISpriteConfigService;
    private config:  IBoardConfig;

    init(board: BoardModel, config: IBoardConfig, sprites: ISpriteConfigService): void {
        this.config  = config;
        this.sprites = sprites;

        this.buildGrid(board);
        this.subscribeEvents();
    }

    onDestroy(): void {
        eventBus.offAll(this.onBlastComplete.bind(this));
        eventBus.offAll(this.onFallComplete.bind(this));
        eventBus.offAll(this.onFillComplete.bind(this));
    }

    private buildGrid(board: BoardModel): void {
        board.getAllTiles().forEach(tile => {
            if (!tile.isEmpty) {
                this.spawnTileView(tile);
            }
        });
    }

    private spawnTileView(model: TileModel): TileView {
        const node = cc.instantiate(this.tilePrefab);
        node.parent = this.node;
        node.setPosition(this.tilePosition(model.row, model.col));

        const view = node.getComponent(TileView) || node.addComponent(TileView);
        view.init(model, this.sprites);

        this.views.set(this.key(model.row, model.col), view);

        node.on(cc.Node.EventType.TOUCH_END, () => {
            this.node.emit('tile:click', { row: view.row, col: view.col });
        });

        return view;
    }

    private subscribeEvents(): void {
        eventBus.on('blast:complete', this.onBlastComplete.bind(this));
        eventBus.on('fall:complete',  this.onFallComplete.bind(this));
        eventBus.on('fill:complete',  this.onFillComplete.bind(this));
    }

    private onBlastComplete(data: { tiles: TileModel[] }): void {
        data.tiles.forEach(tile => {
            const key  = this.key(tile.row, tile.col);
            const view = this.views.get(key);
            if (!view) return;

            this.views.delete(key);
            view.playBlast().then(() => view.node.destroy());
        });
    }

    private onFallComplete(data: { changes: FallChange[] }): void {
        data.changes.forEach(change => {
            const fromKey = this.key(change.from.row, change.from.col);
            const view    = this.views.get(fromKey);
            if (!view) return;

            const toKey = this.key(change.to.row, change.to.col);
            const toPos = this.tilePosition(change.to.row, change.to.col);

            this.views.delete(fromKey);
            this.views.set(toKey, view);
            view.moveTo(change.to.row, change.to.col);
            view.playFall(toPos.y);
        });
    }

    private onFillComplete(data: { tiles: TileModel[] }): void {
        data.tiles.forEach(tile => {
            const view = this.spawnTileView(tile);
            view.playSpawn();
        });
    }

    private tilePosition(row: number, col: number): cc.Vec2 {
        const step = this.config.tileSize + this.config.tileSpacing;
        const x    = col * step - (this.config.cols * step) / 2 + step / 2;
        const y    = -row * step + (this.config.rows * step) / 2 - step / 2;
        return cc.v2(x, y);
    }

    private key(row: number, col: number): string {
        return `${row}:${col}`;
    }
}
