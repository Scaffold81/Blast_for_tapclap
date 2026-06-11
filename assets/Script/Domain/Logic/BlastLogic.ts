import { BoardModel } from '../Models/BoardModel';
import { TileModel }  from '../Models/TileModel';

/** Результат поиска группы: список тайлов и флаг валидности. */
export interface BlastResult {
    tiles:   TileModel[];
    isValid: boolean;
}

/** BFS-поиск связной группы тайлов одного цвета. Не мутирует BoardModel. */
export class BlastLogic {

    findGroup(board: BoardModel, row: number, col: number, minGroupSize: number): BlastResult {
        const origin = board.getTile(row, col);

        if (!origin || origin.isEmpty) {
            return { tiles: [], isValid: false };
        }

        const targetType = origin.type;
        const visited    = new Set<string>();
        const queue:  TileModel[] = [origin];
        const result: TileModel[] = [];

        visited.add(this.key(row, col));

        while (queue.length > 0) {
            const current = queue.shift()!;
            result.push(current);

            for (const neighbour of board.getNeighbours(current.row, current.col)) {
                const k = this.key(neighbour.row, neighbour.col);
                if (!visited.has(k) && neighbour.type === targetType) {
                    visited.add(k);
                    queue.push(neighbour);
                }
            }
        }

        return {
            tiles:   result,
            isValid: result.length >= minGroupSize,
        };
    }

    private key(row: number, col: number): string {
        return `${row}:${col}`;
    }
}
