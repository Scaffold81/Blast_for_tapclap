import { TileView }              from './TileView';
import { TileModel }             from '../../Domain/Models/TileModel';
import { BoardModel }            from '../../Domain/Models/BoardModel';
import { ISpriteConfigService }  from '../../Infrastructure/Sprite/ISpriteConfigService';
import { IBoardConfig }          from '../../Config/BoardConfig';
import { FallChange }            from '../../Domain/Logic/FallLogic';
import { eventBus }              from '../../Core/Events/EventBus';

const { ccclass, property } = cc._decorator;

const FALL_STEP_DELAY = 0.04;
const SWAP_DURATION   = 0.2;

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
    private _pressedKey:     string                     = '';

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
        eventBus.offAll(this.onTilesSwapped.bind(this));
    }

    /** Выделить тайл (уменьшить scale) — для режима бустера. */
    pressTile(row: number, col: number): void {
        this.releasePressed();
        const key  = this.key(row, col);
        const view = this.views.get(key);
        if (!view) return;
        this._pressedKey = key;
        view.playPress();
    }

    /** Сбросить выделение текущего тайла. */
    releasePressed(): void {
        if (!this._pressedKey) return;
        const view = this.views.get(this._pressedKey);
        if (view) view.playRelease();
        this._pressedKey = '';
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

        node.on(cc.Node.EventType.TOUCH_START, () => {
            view.playPress();
        });

        node.on(cc.Node.EventType.TOUCH_END, () => {
            view.playRelease();
            this.node.emit('tile:click', { row: view.row, col: view.col });
        });

        node.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            view.playRelease();
        });

        return view;
    }

    private subscribeEvents(): void {
        eventBus.on('blast:complete', this.onBlastComplete.bind(this));
        eventBus.on('fall:complete',  this.onFallComplete.bind(this));
        eventBus.on('fill:complete',  this.onFillComplete.bind(this));
        eventBus.on('tiles:swapped',  this.onTilesSwapped.bind(this));
    }

    private onBlastComplete(data: { tiles: TileModel[], clickedTile: TileModel }): void {
        this._blastPromise = new Promise(resolve => {
            this._blastResolve = resolve;
        });

        const clickedKey = this.key(data.clickedTile.row, data.clickedTile.col);
        const isSuper    = data.clickedTile.isSuper;
        const superType  = data.clickedTile.superType;
        const tileType   = data.clickedTile.type;
        const promises: Promise<void>[] = [];

        data.tiles.forEach(tile => {
            const key  = this.key(tile.row, tile.col);
            const view = this.views.get(key);
            if (!view) return;

            if (key === clickedKey && isSuper) {
                view.setType(tileType, superType);
                view.playSpawn();
                return;
            }

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

    private onTilesSwapped(data: { tileA: TileModel, tileB: TileModel }): void {
        const keyA = this.key(data.tileA.row, data.tileA.col);
        const keyB = this.key(data.tileB.row, data.tileB.col);

        const viewA = this.views.get(keyA);
        const viewB = this.views.get(keyB);

        if (!viewA || !viewB) return;

        const posA = this.tilePosition(data.tileA.row, data.tileA.col);
        const posB = this.tilePosition(data.tileB.row, data.tileB.col);

        cc.tween(viewA.node).to(SWAP_DURATION, { x: posB.x, y: posB.y }, { easing: 'quadInOut' }).start();
        cc.tween(viewB.node).to(SWAP_DURATION, { x: posA.x, y: posA.y }, { easing: 'quadInOut' }).start();

        this.views.delete(keyA);
        this.views.delete(keyB);
        this.views.set(keyA, viewB);
        this.views.set(keyB, viewA);

        viewA.moveTo(data.tileB.row, data.tileB.col);
        viewB.moveTo(data.tileA.row, data.tileA.col);

        viewA.setType(data.tileA.type, data.tileA.superType);
        viewB.setType(data.tileB.type, data.tileB.superType);
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
                const tile    = tiles[index];
                const tileKey = this.key(tile.row, tile.col);

                const existing = this.views.get(tileKey);
                if (existing) {
                    spawnNext(index + 1, Promise.resolve());
                    return;
                }

                const targetPos = this.tilePosition(tile.row, tile.col);
                const node      = cc.instantiate(this.tilePrefab);
                node.parent     = this.node;
                node.setPosition(cc.v2(spawnX, spawnY));

                const view = node.getComponent(TileView) || node.addComponent(TileView);
                view.init(tile, this.sprites);
                view.moveTo(tile.row, tile.col);

                this.views.set(tileKey, view);

                node.on(cc.Node.EventType.TOUCH_START, () => { view.playPress(); });
                node.on(cc.Node.EventType.TOUCH_END,   () => {
                    view.playRelease();
                    this.node.emit('tile:click', { row: view.row, col: view.col });
                });
                node.on(cc.Node.EventType.TOUCH_CANCEL, () => { view.playRelease(); });

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
