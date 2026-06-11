import { BoardModel } from '../Models/BoardModel';
import { TileType }   from '../Models/TileType';

/** Проверка наличия доступных ходов и перемешивание поля при тупике. Мутирует BoardModel. */
export class ShuffleLogic {

    hasValidGroup(board: BoardModel, minGroupSize: number): boolean {
        const visited = new Set<string>();

        for (let r = 0; r < board.rows; r++) {
            for (let c = 0; c < board.cols; c++) {
                const tile = board.getTile(r, c)!;
                if (tile.isEmpty) continue;

                const key = `${r}:${c}`;
                if (visited.has(key)) continue;

                const group = this.bfsGroup(board, r, c, tile.type, visited);
                if (group >= minGroupSize) return true;
            }
        }

        return false;
    }

    shuffle(board: BoardModel): void {
        const nonEmpty = board.getAllTiles().filter(t => !t.isEmpty);

        for (let i = nonEmpty.length - 1; i > 0; i--) {
            const j               = Math.floor(Math.random() * (i + 1));
            const tmpType         = nonEmpty[i].type;
            const tmpSuper        = nonEmpty[i].superType;
            nonEmpty[i].type      = nonEmpty[j].type;
            nonEmpty[i].superType = nonEmpty[j].superType;
            nonEmpty[j].type      = tmpType;
            nonEmpty[j].superType = tmpSuper;
        }
    }

    private bfsGroup(board: BoardModel, startRow: number, startCol: number, type: TileType, visited: Set<string>): number {
        const queue: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }];
        visited.add(`${startRow}:${startCol}`);
        let count = 0;

        while (queue.length > 0) {
            const { row, col } = queue.shift()!;
            count++;

            for (const neighbour of board.getNeighbours(row, col)) {
                const key = `${neighbour.row}:${neighbour.col}`;
                if (!visited.has(key) && neighbour.type === type) {
                    visited.add(key);
                    queue.push({ row: neighbour.row, col: neighbour.col });
                }
            }
        }

        return count;
    }
}
