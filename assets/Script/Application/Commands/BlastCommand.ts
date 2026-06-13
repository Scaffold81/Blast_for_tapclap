import { ICommand }          from './ICommand';
import { BoardModel }        from '../../Domain/Models/BoardModel';
import { ScoreModel }        from '../../Domain/Models/ScoreModel';
import { BlastLogic }        from '../../Domain/Logic/BlastLogic';
import { SuperTileCommand }  from './SuperTileCommand';
import { SuperTileRegistry } from '../SuperTiles/SuperTileRegistry';
import { IGameConfig }       from '../../Config/GameConfig';
import { IBoardConfig }      from '../../Config/BoardConfig';
import { SuperTileType }     from '../../Domain/Models/TileType';
import { TileModel }         from '../../Domain/Models/TileModel';
import { eventBus }          from '../../Core/Events/EventBus';

const S_ROW  = 'row'  as SuperTileType;
const S_COL  = 'col'  as SuperTileType;
const S_BOMB = 'bomb' as SuperTileType;
const S_MAX  = 'max'  as SuperTileType;

/** Взрывает группу тайлов по клику. Начисляет очки, тратит ход, генерирует супер-тайл при необходимости. */
export class BlastCommand implements ICommand {

    constructor(
        private board:       BoardModel,
        private score:       ScoreModel,
        private blast:       BlastLogic,
        private gameConfig:  IGameConfig,
        private boardConfig: IBoardConfig,
        private registry:    SuperTileRegistry,
        private row:         number,
        private col:         number,
    ) {}

    execute(): void {
        const result = this.blast.findGroup(this.board, this.row, this.col, this.boardConfig.minGroupSize);
        if (!result.isValid) return;

        const groupSize   = result.tiles.length;
        const scoreGain   = groupSize * this.gameConfig.scorePerTile
                          + Math.max(0, groupSize - this.boardConfig.minGroupSize) * this.gameConfig.scoreGroupBonus;

        const spawnSuper  = groupSize >= this.boardConfig.superTileThreshold;
        const clickedTile = this.board.getTile(this.row, this.col)!;
        const savedType   = clickedTile.type;

        const superTilesData = result.tiles
            .filter(t => t.isSuper)
            .map(t => ({ row: t.row, col: t.col, type: t.type, superType: t.superType }));

        result.tiles.forEach(t => t.setEmpty());

        if (spawnSuper) {
            clickedTile.type      = savedType;
            clickedTile.superType = this.resolveSuperType(result.tiles, groupSize);
        }

        this.score.addScore(scoreGain);
        this.score.spendMove();

        eventBus.emit('blast:complete', { tiles: result.tiles, clickedTile });
        eventBus.emit('score:changed',  { score: this.score.score, delta: scoreGain });
        eventBus.emit('moves:changed',  { movesLeft: this.score.movesLeft });

        superTilesData.forEach(saved => {
            const tile = this.board.getTile(saved.row, saved.col);
            if (!tile) return;
            tile.type      = saved.type;
            tile.superType = saved.superType;
            new SuperTileCommand(this.board, this.score, this.gameConfig, this.registry, saved.row, saved.col).execute();
        });
    }

    private resolveSuperType(tiles: TileModel[], groupSize: number): SuperTileType {
        if (groupSize >= this.boardConfig.superMaxThreshold)  return S_MAX;
        if (groupSize >= this.boardConfig.superBombThreshold) return S_BOMB;

        const rowCounts: { [row: number]: number } = {};
        tiles.forEach(t => { rowCounts[t.row] = (rowCounts[t.row] || 0) + 1; });
        const maxRow = Math.max(...Object.keys(rowCounts).map(k => rowCounts[+k]));

        const colCounts: { [col: number]: number } = {};
        tiles.forEach(t => { colCounts[t.col] = (colCounts[t.col] || 0) + 1; });
        const maxCol = Math.max(...Object.keys(colCounts).map(k => colCounts[+k]));

        if (maxRow >= this.boardConfig.superTileThreshold && maxRow >= maxCol) return S_ROW;
        if (maxCol >= this.boardConfig.superTileThreshold) return S_COL;

        return S_BOMB;
    }
}
