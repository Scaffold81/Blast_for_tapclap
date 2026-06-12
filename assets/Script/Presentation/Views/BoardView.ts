import { TileView }              from './TileView';
import { TileModel }             from '../../Domain/Models/TileModel';
import { BoardModel }            from '../../Domain/Models/BoardModel';
import { ISpriteConfigService }  from '../../Infrastructure/Sprite/ISpriteConfigService';
import { IBoardConfig }          from '../../Config/BoardConfig';
import { FallChange }            from '../../Domain/Logic/FallLogic';
import { eventBus }              from '../../Core/Events/EventBus';

const { ccclass, property } = cc._decorator;

const FALL_STEP_DELAY = 0.04;

/** Визуальное представление игрового поля. Создаёт и позиционирует TileView, реагирует на игровые события. */
@ccclass
export class BoardView extends cc.Component {

    @property(cc.Prefab)
    tilePrefab: cc.Prefab = null;

    private views:           Map<string, TileView>    = new Map();
    private sprites:         ISpriteConfigService;
    private config:          IBoardConfig;
    private _colTopPromises: Map<number, Promise<void>> = new Map();
    private _colTopRowByCol: Map<number, number>        = new Map();
    private _blastPromise:   Promise<void>              = Promise.resolve();
    private _blastResolve:   (() => void) | null        = null;

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
        this._blastPromise = new Promise(resolve => {
            this._blastResolve = resolve;
        });

        const promises: Promise<void>[] = [];

        data.tiles.forEach(tile => {
            const key  = this.key(tile.row, tile.col);
            const view = this.views.get(key);
            if (!view) return;

            this.views.delete(key);
            promises.push(view.playBlast().then(() => view.node.destroy()));
        });

        Promise.all(promises).then(() => {
            if (this._blastResolve) {
                this._blastResolve();
                this._blastResolve = null;
            }
        });
    }

    private onFallComplete(data: { changes: FallChange[] }): void {
        this._colTopPromises.clear();
        this._colTopRowByCol.clear();

        if (data.changes.length === 0) return;

        const sorted = data.changes.slice().sort((a, b) => b.from.row - a.from.row);

        sorted.forEach((change, index) => {
            const fromKey = this.key(change.from.row, change.from.col);
            const view    = this.views.get(fromKey);
            if (!view) return;

            const toKey = this.key(change.to.row, change.to.col);
            const toPos = this.tilePosition(change.to.row, change.to.col);
            const delay = index * FALL_STEP_DELAY;

            this.views.delete(fromKey);
            this.views.set(toKey, view);
            view.moveTo(change.to.row, change.to.col);

            const promise = view.playFall(toPos.y, delay);

            const col        = change.from.col;
            const currentTop = this._colTopRowByCol.get(col) ?? 999;

            if (change.from.row < currentTop) {
                this._colTopPromises.set(col, promise);
                this._colTopRowByCol.set(col, change.from.row);
            }
        });
    }

    private onFillComplete(data: { tiles: TileModel[] }): void {
        const byCol: Map<number, TileModel[]> = new Map();
        data.tiles.forEach(tile => {
            if (!byCol.has(tile.col)) byCol.set(tile.col, []);
            byCol.get(tile.col)!.push(tile);
        });

        byCol.forEach((tiles, col) => {
            // Снизу вверх — row:2 первым, row:1 вторым, row:0 последним
            tiles.sort((a, b) => b.row - a.row);
            const waitFor = this._colTopPromises.get(col) || this._blastPromise;
            this.spawnChain(tiles, col, waitFor);
        });

        this._colTopPromises.clear();
        this._colTopRowByCol.clear();
    }

    private spawnChain(tiles: TileModel[], col: number, after: Promise<void>): void {
        if (tiles.length === 0) return;

        const step    = this.config.tileSize + this.config.tileSpacing;
        const row0Pos = this.tilePosition(0, col);
        const spawnY  = row0Pos.y + step;
        const spawnX  = row0Pos.x;

        const spawnNext = (index: number, waitFor: Promise<void>) => {
            if (index >= tiles.length) return;

            waitFor.then(() => {
                const tile      = tiles[index];
                const targetPos = this.tilePosition(tile.row, tile.col);

                const node = cc.instantiate(this.tilePrefab);
                node.parent = this.node;
                node.setPosition(cc.v2(spawnX, spawnY));

                const view = node.getComponent(TileView) || node.addComponent(TileView);
                view.init(tile, this.sprites);
                view.moveTo(tile.row, tile.col);

                this.views.set(this.key(tile.row, tile.col), view);

                node.on(cc.Node.EventType.TOUCH_END, () => {
                    this.node.emit('tile:click', { row: view.row, col: view.col });
                });

                const fallPromise = view.playFall(targetPos.y, 0);
                spawnNext(index + 1, fallPromise);
            });
        };

        spawnNext(0, after);
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
