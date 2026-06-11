import { ICommand }      from './ICommand';
import { BoardModel }    from '../../Domain/Models/BoardModel';
import { ScoreModel }    from '../../Domain/Models/ScoreModel';
import { BlastLogic }    from '../../Domain/Logic/BlastLogic';
import { IGameConfig }   from '../../Config/GameConfig';
import { IBoardConfig }  from '../../Config/BoardConfig';
import { SuperTileType } from '../../Domain/Models/TileType';
import { eventBus }      from '../../Core/Events/EventBus';

/** Взрывает группу тайлов по клику. Начисляет очки, тратит ход, генерирует супер-тайл при необходимости. */
export class BlastCommand implements ICommand {

    constructor(
        private board:       BoardModel,
        private score:       ScoreModel,
        private blast:       BlastLogic,
        private gameConfig:  IGameConfig,
        private boardConfig: IBoardConfig,
        private row:         number,
        private col:         number,
    ) {}

    execute(): void {
        const result = this.blast.findGroup(this.board, this.row, this.col, this.boardConfig.minGroupSize);

        if (!result.isValid) return;

        const groupSize  = result.tiles.length;
        const scoreGain  = groupSize * this.gameConfig.scorePerTile
                         + Math.max(0, groupSize - this.boardConfig.minGroupSize) * this.gameConfig.scoreGroupBonus;

        const spawnSuper = groupSize >= this.boardConfig.superTileThreshold;
        const clicked    = this.board.getTile(this.row, this.col)!;

        result.tiles.forEach(t => t.setEmpty());

        if (spawnSuper) {
            clicked.superType = SuperTileType.Bomb;
        }

        this.score.addScore(scoreGain);
        this.score.spendMove();

        eventBus.emit('blast:complete',  { tiles: result.tiles, clickedTile: clicked });
        eventBus.emit('score:changed',   { score: this.score.score, delta: scoreGain });
        eventBus.emit('moves:changed',   { movesLeft: this.score.movesLeft });
    }
}
