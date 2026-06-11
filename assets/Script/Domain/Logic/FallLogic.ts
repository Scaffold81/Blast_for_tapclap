import { BoardModel } from '../Models/BoardModel';
import { TileModel }  from '../Models/TileModel';

/** Координаты перемещения одного тайла при падении. */
export interface FallChange {
    from: { row: number; col: number };
    to:   { row: number; col: number };
}

/** Результат применения гравитации: список перемещений и переместившиеся тайлы. */
export interface FallResult {
    changes: FallChange[];
    moved:   TileModel[];
}

/** Гравитация: сдвигает тайлы вниз на место пустых ячеек. Мутирует BoardModel. */
export class FallLogic {

    apply(board: BoardModel): FallResult {
        const changes: FallChange[] = [];
        const moved:   TileModel[]  = [];

        for (let c = 0; c < board.cols; c++) {
            let emptyRow = board.rows - 1;

            for (let r = board.rows - 1; r >= 0; r--) {
                const tile = board.getTile(r, c)!;

                if (!tile.isEmpty) {
                    if (emptyRow !== r) {
                        const target = board.getTile(emptyRow, c)!;
                        target.copyFrom(tile);
                        tile.setEmpty();

                        changes.push({ from: { row: r, col: c }, to: { row: emptyRow, col: c } });
                        moved.push(target);
                    }
                    emptyRow--;
                }
            }
        }

        return { changes, moved };
    }
}
