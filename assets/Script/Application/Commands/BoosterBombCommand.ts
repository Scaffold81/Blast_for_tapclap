import { ICommand }    from './ICommand';
import { BoardModel }  from '../../Domain/Models/BoardModel';
import { ScoreModel }  from '../../Domain/Models/ScoreModel';
import { IGameConfig } from '../../Config/GameConfig';
import { eventBus }    from '../../Core/Events/EventBus';

/** Взрывает все тайлы в радиусе R от указанной ячейки. */
export class BoosterBombCommand implements ICommand {

    constructor(
        private board:      BoardModel,
        private score:      ScoreModel,
        private gameConfig: IGameConfig,
        private row:        number,
        private col:        number,
        private radius:     number,
    ) {}

    execute(): void {
        const affected = this.board.getAllTiles().filter(t => {
            const dr = Math.abs(t.row - this.row);
            const dc = Math.abs(t.col - this.col);
            return dr <= this.radius && dc <= this.radius && !t.isEmpty;
        });

        if (affected.length === 0) return;

        const scoreGain = affected.length * this.gameConfig.scorePerTile;
        affected.forEach(t => t.setEmpty());
        this.score.addScore(scoreGain);

        eventBus.emit('blast:complete',  { tiles: affected, clickedTile: this.board.getTile(this.row, this.col)! });
        eventBus.emit('score:changed',   { score: this.score.score, delta: scoreGain });
    }
}
