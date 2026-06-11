import { TileView }              from './TileView';
import { TileModel }             from '../../Domain/Models/TileModel';
import { BoardModel }            from '../../Domain/Models/BoardModel';
import { ISpriteConfigService }  from '../../Infrastructure/Sprite/ISpriteConfigService';
import { IBoardConfig }          from '../../Config/BoardConfig';
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
            this.node.emit('tile:click', { row: model.row, col: model.col });
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
            const view = this.views.get(this.key(tile.row, tile.col));
            if (view) {
                view.playBlast().then(() => {
                    view.node.destroy();
                    this.views.delete(this.key(tile.row, tile.col));
                });
            }
        });
    }

    private onFallComplete(data: { tiles: TileModel[] }): void {
        data.tiles.forEach(tile => {
            const view = this.views.get(this.key(tile.row, tile.col));
            if (view) {
                const pos = this.tilePosition(tile.row, tile.col);
                view.playFall(pos.y);
            }
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
        const x    = col * step - (this.config.cols - 1) * step / 2;
        const y    = -row * step + (this.config.rows - 1) * step / 2;
        return cc.v2(x, y);
    }

    private key(row: number, col: number): string {
        return `${row}:${col}`;
    }
}
