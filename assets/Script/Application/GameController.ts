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
import { BlastCommand }           from './Commands/BlastCommand';
import { ShuffleCommand }         from './Commands/ShuffleCommand';
import { BoosterBombCommand }     from './Commands/BoosterBombCommand';
import { BoosterTeleportCommand } from './Commands/BoosterTeleportCommand';
import { SuperTileCommand }       from './Commands/SuperTileCommand';
import { IdleState }              from './States/IdleState';
import { ProcessingState }        from './States/ProcessingState';
import { FallingState }           from './States/FallingState';
import { FillingState }           from './States/FillingState';
import { CheckWinState }          from './States/CheckWinState';
import { GameOverState }          from './States/GameOverState';
import { GameConfig }             from '../Config/GameConfig';
import { BoardConfig }            from '../Config/BoardConfig';
import { BoosterConfig }          from '../Config/BoosterConfig';
import { TileSpriteConfig }       from '../Config/TileSpriteConfig';
import { BoardView }              from '../Presentation/Views/BoardView';

const { ccclass, property } = cc._decorator;

/** Точка входа в игровую логику. Собирает DI, запускает FSM, маршрутизирует ввод в команды. */
@ccclass
export class GameController extends cc.Component {

    @property(BoardView)
    boardView: BoardView = null;

    @property(TileSpriteConfig)
    tileSpriteConfig: TileSpriteConfig = null;

    private fsm:          StateMachine;
    private board:        BoardModel;
    private score:        ScoreModel;
    private blast:        BlastLogic;
    private fall:         FallLogic;
    private shuffle:      ShuffleLogic;
    private shufflesLeft: number;

    onLoad(): void {
        this.registerDependencies();
        this.initServices();
        this.initFSM();
        this.subscribeEvents();
        this.startGame();
    }

    onDestroy(): void {
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
        container.bind(TYPES.EventBus,       () => eventBus);
    }

    private initServices(): void {
        this.blast        = container.get<BlastLogic>(TYPES.BlastLogic);
        this.fall         = container.get<FallLogic>(TYPES.FallLogic);
        this.shuffle      = container.get<ShuffleLogic>(TYPES.ShuffleLogic);
        this.shufflesLeft = GameConfig.shuffleMaxCount;

        const generator = container.get<BoardGenerator>(TYPES.BoardGenerator);
        this.board = generator.generate(BoardConfig);
        this.score = new ScoreModel(GameConfig.targetScore, GameConfig.maxMoves);
    }

    private initFSM(): void {
        this.fsm = container.get<StateMachine>(TYPES.StateMachine);
        this.fsm.register('Idle',       new IdleState());
        this.fsm.register('Processing', new ProcessingState());
        this.fsm.register('Falling',    new FallingState());
        this.fsm.register('Filling',    new FillingState());
        this.fsm.register('CheckWin',   new CheckWinState());
        this.fsm.register('GameOver',   new GameOverState());
    }

    private startGame(): void {
        this.fsm.enter('Idle');

        if (this.tileSpriteConfig && this.boardView) {
            const sprites = new SpriteConfigService(this.tileSpriteConfig);
            this.boardView.init(this.board, BoardConfig, sprites);

            this.boardView.node.on('tile:click', (data: { row: number; col: number }) => {
                this.onTileClick(data.row, data.col);
            });
        } else {
            cc.error('[GameController] boardView или tileSpriteConfig не привязаны!');
        }
    }

    private subscribeEvents(): void {
        eventBus.on('game:restart',      () => this.restartGame());
        eventBus.on('booster:activated', ({ boosterType }) => this.onBoosterActivated(boosterType));
    }

    private onTileClick(row: number, col: number): void {
        if (!this.fsm.is('Idle')) return;

        const tile = this.board.getTile(row, col);
        if (!tile || tile.isEmpty) return;

        this.fsm.enter('Processing');

        if (tile.isSuper) {
            new SuperTileCommand(this.board, this.score, GameConfig, row, col).execute();
        } else {
            new BlastCommand(this.board, this.score, this.blast, GameConfig, BoardConfig, row, col).execute();
        }

        this.afterBlast();
    }

    private onBoosterActivated(boosterType: string): void {
        if (!this.fsm.is('Idle')) return;

        if (boosterType === 'bomb') {
            const centerRow = Math.floor(BoardConfig.rows / 2);
            const centerCol = Math.floor(BoardConfig.cols / 2);
            this.fsm.enter('Processing');
            new BoosterBombCommand(this.board, this.score, GameConfig, centerRow, centerCol, BoosterConfig.bombRadius).execute();
            this.afterBlast();
        } else if (boosterType === 'teleport') {
            const nonEmpty = this.board.getAllTiles().filter(t => !t.isEmpty);
            if (nonEmpty.length < 2) return;

            const a = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
            let b   = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
            while (b === a) b = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];

            new BoosterTeleportCommand(this.board, a.row, a.col, b.row, b.col).execute();
        }
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
        container.clear();
        this.registerDependencies();
        this.initServices();
        this.fsm.enter('Idle');

        if (this.tileSpriteConfig && this.boardView) {
            const sprites = new SpriteConfigService(this.tileSpriteConfig);
            this.boardView.init(this.board, BoardConfig, sprites);
        }

        eventBus.emit('score:changed', { score: this.score.score, delta: 0 });
        eventBus.emit('moves:changed', { movesLeft: this.score.movesLeft });
    }
}
