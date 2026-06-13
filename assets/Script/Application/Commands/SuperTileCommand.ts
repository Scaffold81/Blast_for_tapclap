import { ICommand }      from './ICommand';
import { BoardModel }    from '../../Domain/Models/BoardModel';
import { ScoreModel }    from '../../Domain/Models/ScoreModel';
import { SuperTileType } from '../../Domain/Models/TileType';
import { TileModel }     from '../../Domain/Models/TileModel';
import { IGameConfig }   from '../../Config/GameConfig';
import { eventBus }      from '../../Core/Events/EventBus';

/** Активирует супер-тайл: уничтожает строку, столбец, радиус или всё поле в зависимости от типа. */
export class SuperTileCommand implements ICommand {

    constructor(
        private board:      BoardModel,
        private score:      ScoreModel,
        private gameConfig: IGameConfig,
        private row:        number,
        private col:        number,
    ) {}

    execute(): void {
        const tile = this.board.getTile(this.row, this.col);
        if (!tile || !tile.isSuper) return;

        const superType = tile.superType;
        const affected  = this.collect(superType);

        if (affected.length === 0) return;

        // Сохраняем данные супертайлов в affected ДО очистки
        const chainedSupers = affected
            .filter(t => t.isSuper && !(t.row === this.row && t.col === this.col))
            .map(t => ({ row: t.row, col: t.col, type: t.type, superType: t.superType }));

        const scoreGain = affected.length * this.gameConfig.scorePerTile;
        affected.forEach(t => t.setEmpty());
        this.score.addScore(scoreGain);

        eventBus.emit('blast:complete',      { tiles: affected, clickedTile: tile });
        eventBus.emit('supertile:activated', { tile, affectedTiles: affected });
        eventBus.emit('score:changed',       { score: this.score.score, delta: scoreGain });

        // Активируем цепочку супертайлов
        chainedSupers.forEach(saved => {
            const chainTile = this.board.getTile(saved.row, saved.col);
            if (!chainTile) return;
            chainTile.type      = saved.type;
            chainTile.superType = saved.superType;
            new SuperTileCommand(this.board, this.score, this.gameConfig, saved.row, saved.col).execute();
        });
    }

    private collect(superType: SuperTileType): TileModel[] {
        switch (superType) {
            case SuperTileType.Row:
                return this.board.getRow(this.row).filter(t => !t.isEmpty);
            case SuperTileType.Col:
                return this.board.getCol(this.col).filter(t => !t.isEmpty);
            case SuperTileType.Bomb:
                return this.board.getAllTiles().filter(t => {
                    const dr = Math.abs(t.row - this.row);
                    const dc = Math.abs(t.col - this.col);
                    return dr <= 2 && dc <= 2 && !t.isEmpty;
                });
            case SuperTileType.Max:
                return this.board.getAllTiles().filter(t => !t.isEmpty);
            default:
                return [];
        }
    }
}
