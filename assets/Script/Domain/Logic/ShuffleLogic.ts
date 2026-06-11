import { BoardModel } from '../Models/BoardModel';
import { TileType }   from '../Models/TileType';

/** Проверка наличия доступных ходов и перемешивание поля при тупике. Мутирует BoardModel. */
export class ShuffleLogic {

    hasValidGroup(board: BoardModel, minGroupSize: number): boolean {
        for (let r = 0; r < board.rows; r++) {
            for (let c = 0; c < board.cols; c++) {
                const tile = board.getTile(r, c)!;
                if (tile.isEmpty) continue;

                const groupSize = this.countGroup(board, r, c, tile.type, new Set());
                if (groupSize >= minGroupSize) return true;
            }
        }
        return false;
    }

    shuffle(board: BoardModel): void {
        const nonEmpty = board.getAllTiles().filter(t => !t.isEmpty);

        for (let i = nonEmpty.length - 1; i > 0; i--) {
            const j              = Math.floor(Math.random() * (i + 1));
            const tmpType        = nonEmpty[i].type;
            const tmpSuper       = nonEmpty[i].superType;
            nonEmpty[i].type     = nonEmpty[j].type;
            nonEmpty[i].superType = nonEmpty[j].superType;
            nonEmpty[j].type     = tmpType;
            nonEmpty[j].superType = tmpSuper;
        }
    }

    private countGroup(board: BoardModel, row: number, col: number, type: TileType, visited: Set<string>): number {
        const key = `${row}:${col}`;
        if (visited.has(key)) return 0;

        const tile = board.getTile(row, col);
        if (!tile || tile.type !== type) return 0;

        visited.add(key);
        let count = 1;

        for (const neighbour of board.getNeighbours(row, col)) {
            count += this.countGroup(board, neighbour.row, neighbour.col, type, visited);
        }

        return count;
    }
}
