import { container }              from '../Core/DI/Container';
import { TYPES }                  from '../Core/DI/Types';
import { eventBus }               from '../Core/Events/EventBus';
import { StateMachine }           from '../Core/FSM/StateMachine';
import { BoardModel }             from '../Domain/Models/BoardModel';
import { TileModel }              from '../Domain/Models/TileModel';
import { ScoreModel }             from '../Domain/Models/ScoreModel';
import { BlastLogic }             from '../Domain/Logic/BlastLogic';
import { FallLogic }              from '../Domain/Logic/FallLogic';
import { ShuffleLogic }           from '../Domain/Logic/ShuffleLogic';
import { BoardGenerator }         from '../Infrastructure/Generator/BoardGenerator';
import { SpriteConfigService }    from '../Infrastructure/Sprite/SpriteConfigService';
import { PoolService }            from '../Infrastructure/Pool/PoolService';
import { IPoolService }           from '../Infrastructure/Pool/IPoolService';
import { BlastCommand }           from './Commands/BlastCommand';
import { ShuffleCommand }         from './Commands/ShuffleCommand';
import { SuperTileCommand }       from './Commands/SuperTileCommand';
import { BoosterRegistry }        from './Boosters/BoosterRegistry';
import { BombBooster }            from './Boosters/BombBooster';
import { TeleportBooster }        from './Boosters/TeleportBooster';
import { IBooster }               from './Boosters/IBooster';
import { SuperTileRegistry }      from './SuperTiles/SuperTileRegistry';
import { RowEffect, ColEffect, BombEffect, MaxEffect } from './SuperTiles/SuperTileEffects';
import { IdleState }              from './States/IdleState';
import { ProcessingState }        from './States/ProcessingState';
import { FallingState }           from './States/FallingState';
import { FillingState }           from './States/FillingState';
import { CheckWinState }          from './States/CheckWinState';
import { GameOverState }          from './States/GameOverState';
import { BoosterAimingState }     from './States/BoosterAimingState';
import { GameConfig }             from '../Config/GameConfig';
import { BoardConfig }            from '../Config/BoardConfig';
import { BoosterConfig }          from '../Config/BoosterConfig';
import { TileSpriteConfig }       from '../Config/TileSpriteConfig';
import { BoardView }              from '../Presentation/Views/BoardView';
import { BoosterPanelView }       from '../Presentation/UI/BoosterPanelView';

const { ccclass, property } = cc._decorator;

/** Точка входа в игровую логику. Собирает DI, запускает FSM, маршрутизирует ввод в команды. */
@ccclass
export class GameController extends cc.Component {

    @property(BoardView)
    boardView: BoardView = null;

    @property(TileSpriteConfig)
    tileSpriteConfig: TileSpriteConfig = null;

    @property(BoosterPanelView)
    boosterPanelView: BoosterPanelView = null;

    private fsm:               StateMachine;
    private board:             BoardModel;
    private score:             ScoreModel;
    private blast:             BlastLogic;
    private fall:              FallLogic;
    private shuffle:           ShuffleLogic;
    private shufflesLeft:      number;
    private pool:              IPoolService;
    private boosterRegistry:   BoosterRegistry;
    private superTileRegistry: SuperTileRegistry;
    private activeBooster:     IBooster | null = null;
    private tappedTiles:       TileModel[]     = [];

    onLoad(): void {
        this.registerDependencies();
        this.initServices();
        this.initFSM();
        this.initBoosters();
        this.initSuperTiles();
        this.subscribeEvents();
        this.startGame();
    }

    onDestroy(): void {
        this.pool.clear();
        eventBus.clear();
    }

    private registerDependencies(): void {
        container.bindValue(TYPES.GameConfig,    GameConfig);
        container.bindValue(TYPES.BoardConfig,   BoardConfig);
        container.bindValue(TYPES.BoosterConfig, BoosterConfig);
        container.bind(TYPES.StateMachine,   () => new StateMachine());
        container.bind(TYPES.BlastLogic,     () => new BlastLogic());
        container.bind(TYPES.FallLogic,      () => new FallLogic());
        container.bind(TYPES.ShuffleLogic,   () => new ShuffleLogic());
        container.bind(TYPES.BoardGenerator, () => new BoardGenerator());
        container.bind(TYPES.PoolService,    () => new PoolService());
        container.bind(TYPES.EventBus,       () => eventBus);
    }

    private initServices(): void {
        this.blast        = container.get<BlastLogic>(TYPES.BlastLogic);
        this.fall         = container.get<FallLogic>(TYPES.FallLogic);
        this.shuffle      = container.get<ShuffleLogic>(TYPES.ShuffleLogic);
        this.pool         = container.get<IPoolService>(TYPES.PoolService);
        this.shufflesLeft = GameConfig.shuffleMaxCount;
        const generator   = container.get<BoardGenerator>(TYPES.BoardGenerator);
        this.board        = generator.generate(BoardConfig);
        this.score        = new ScoreModel(GameConfig.targetScore, GameConfig.maxMoves);
    }

    private initFSM(): void {
        this.fsm = container.get<StateMachine>(TYPES.StateMachine);
        this.fsm.register('Idle',          new IdleState());
        this.fsm.register('Processing',    new ProcessingState());
        this.fsm.register('Falling',       new FallingState());
        this.fsm.register('Filling',       new FillingState());
        this.fsm.register('CheckWin',      new CheckWinState());
        this.fsm.register('GameOver',      new GameOverState());
        this.fsm.register('BoosterAiming', new BoosterAimingState());
    }

    private initBoosters(): void {
        this.boosterRegistry = new BoosterRegistry();
        this.boosterRegistry.register(new BombBooster(BoosterConfig));
        this.boosterRegistry.register(new TeleportBooster());
    }

    private initSuperTiles(): void {
        this.superTileRegistry = new SuperTileRegistry();
        this.superTileRegistry.register(new RowEffect());
        this.superTileRegistry.register(new ColEffect());
        this.superTileRegistry.register(new BombEffect());
        this.superTileRegistry.register(new MaxEffect());
    }

    private startGame(): void {
        this.fsm.enter('Idle');
        if (this.tileSpriteConfig && this.boardView) {
            // Предзагружаем пул — 63 тайла на поле + запас
            this.pool.preload(this.boardView.tilePrefab, BoardConfig.rows * BoardConfig.cols + 10);
            const sprites = new SpriteConfigService(this.tileSpriteConfig);
            this.boardView.init(this.board, BoardConfig, sprites, this.pool);
            this.boardView.node.on('tile:click', (data: { row: number; col: number }) => {
                this.onTileClick(data.row, data.col);
            });
        } else {
            cc.error('[GameController] boardView или tileSpriteConfig не привязаны!');
        }
    }

    private subscribeEvents(): void {
        eventBus.on('game:restart',      () => this.restartGame());
        eventBus.on('booster:aiming',    ({ boosterType }) => this.onBoosterAiming(boosterType));
        eventBus.on('booster:cancelled', () => this.onBoosterCancelled());
    }

    private onBoosterAiming(boosterType: string): void {
        if (!this.fsm.is('Idle')) return;
        const booster = this.boosterRegistry.get(boosterType);
        if (!booster) return;
        this.activeBooster = booster;
        this.tappedTiles   = [];
        this.fsm.enter('BoosterAiming');
    }

    private onBoosterCancelled(): void {
        if (!this.fsm.is('BoosterAiming')) return;
        if (this.boardView) this.boardView.releasePressed();
        this.activeBooster = null;
        this.tappedTiles   = [];
        this.fsm.enter('Idle');
    }

    private onTileClick(row: number, col: number): void {
        if (this.fsm.is('BoosterAiming')) {
            this.handleBoosterTap(row, col);
            return;
        }
        if (!this.fsm.is('Idle')) return;
        const tile = this.board.getTile(row, col);
        if (!tile || tile.isEmpty) return;
        this.fsm.enter('Processing');
        if (tile.isSuper) {
            new SuperTileCommand(this.board, this.score, GameConfig, this.superTileRegistry, row, col).execute();
        } else {
            new BlastCommand(this.board, this.score, this.blast, GameConfig, BoardConfig, this.superTileRegistry, row, col).execute();
        }
        this.afterBlast();
    }

    private handleBoosterTap(row: number, col: number): void {
        if (!this.activeBooster) return;
        const tile = this.board.getTile(row, col);
        if (!tile || tile.isEmpty) return;
        const alreadyTapped = this.tappedTiles.some(t => t.row === row && t.col === col);
        if (alreadyTapped) return;
        this.tappedTiles.push(tile);

        if (this.tappedTiles.length < this.activeBooster.tapsRequired) {
            if (this.boardView) this.boardView.pressTile(row, col);
            return;
        }

        if (!this.activeBooster.validate(this.tappedTiles, this.board)) {
            if (this.boardView) this.boardView.releasePressed();
            this.tappedTiles = [tile];
            if (this.boardView) this.boardView.pressTile(row, col);
            return;
        }

        if (this.boardView) this.boardView.releasePressed();

        const booster     = this.activeBooster;
        const boosterType = booster.type;
        const tiles       = this.tappedTiles.slice();

        this.activeBooster = null;
        this.tappedTiles   = [];

        this.fsm.enter('Processing');
        booster.execute(tiles, this.board, this.score, GameConfig);
        eventBus.emit('booster:complete', { boosterType });

        this.afterBlast();
    }

    private afterBlast(): void {
        this.fsm.enter('Falling');
        const fallResult = this.fall.apply(this.board);
        eventBus.emit('fall:complete', { changes: fallResult.changes });
        this.fsm.enter('Filling');
        const filled = this.fillBoard();
        eventBus.emit('fill:complete', { tiles: filled });
        this.fsm.enter('CheckWin');
        this.checkEndConditions();
    }

    private fillBoard(): TileModel[] {
        const colors  = ['blue', 'green', 'yellow', 'red', 'purple'].slice(0, BoardConfig.colorCount);
        const filled: TileModel[] = [];
        this.board.getAllTiles().forEach(t => {
            if (t.isEmpty) {
                t.type = colors[Math.floor(Math.random() * colors.length)] as any;
                filled.push(t);
            }
        });
        return filled;
    }

    private checkEndConditions(): void {
        if (this.score.isWin) {
            this.fsm.enter('GameOver');
            eventBus.emit('game:win', { score: this.score.score, movesLeft: this.score.movesLeft });
            return;
        }
        if (this.score.isLose) {
            this.fsm.enter('GameOver');
            eventBus.emit('game:lose', { reason: 'no_moves' });
            return;
        }
        if (!this.shuffle.hasValidGroup(this.board, BoardConfig.minGroupSize)) {
            if (this.shufflesLeft > 0) {
                new ShuffleCommand(this.board, this.shuffle, this.shufflesLeft, (n) => {
                    this.shufflesLeft = n;
                }).execute();
            } else {
                this.fsm.enter('GameOver');
                eventBus.emit('game:lose', { reason: 'no_shuffles' });
                return;
            }
        }
        this.fsm.enter('Idle');
    }

    private restartGame(): void {
        this.pool.clear();
        container.clear();
        this.registerDependencies();
        this.initServices();
        this.initBoosters();
        this.initSuperTiles();
        this.activeBooster = null;
        this.tappedTiles   = [];
        if (this.boardView) this.boardView.releasePressed();
        this.fsm.enter('Idle');
        if (this.tileSpriteConfig && this.boardView) {
            this.pool.preload(this.boardView.tilePrefab, BoardConfig.rows * BoardConfig.cols + 10);
            const sprites = new SpriteConfigService(this.tileSpriteConfig);
            this.boardView.init(this.board, BoardConfig, sprites, this.pool);
        }
        eventBus.emit('score:changed', { score: this.score.score, delta: 0 });
        eventBus.emit('moves:changed', { movesLeft: this.score.movesLeft });
    }
}
