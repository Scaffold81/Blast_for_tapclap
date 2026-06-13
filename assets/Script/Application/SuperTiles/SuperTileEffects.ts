import { ISuperTileEffect } from './ISuperTileEffect';
import { TileModel }        from '../../Domain/Models/TileModel';
import { BoardModel }       from '../../Domain/Models/BoardModel';

/** Уничтожает всю строку. */
export class RowEffect implements ISuperTileEffect {
    readonly type = 'row';
    collect(board: BoardModel, row: number, _col: number): TileModel[] {
        return board.getRow(row).filter(t => !t.isEmpty);
    }
}

/** Уничтожает весь столбец. */
export class ColEffect implements ISuperTileEffect {
    readonly type = 'col';
    collect(board: BoardModel, _row: number, col: number): TileModel[] {
        return board.getCol(col).filter(t => !t.isEmpty);
    }
}

/** Уничтожает тайлы в радиусе 2. */
export class BombEffect implements ISuperTileEffect {
    readonly type = 'bomb';
    collect(board: BoardModel, row: number, col: number): TileModel[] {
        return board.getAllTiles().filter(t => {
            const dr = Math.abs(t.row - row);
            const dc = Math.abs(t.col - col);
            return dr <= 2 && dc <= 2 && !t.isEmpty;
        });
    }
}

/** Уничтожает всё поле. */
export class MaxEffect implements ISuperTileEffect {
    readonly type = 'max';
    collect(board: BoardModel, _row: number, _col: number): TileModel[] {
        return board.getAllTiles().filter(t => !t.isEmpty);
    }
}
