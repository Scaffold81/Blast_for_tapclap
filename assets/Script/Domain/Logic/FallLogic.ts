import { BoardModel } from '../Models/BoardModel';

export interface FallChange {
    from: { row: number; col: number };
    to:   { row: number; col: number };
}

export interface FallResult {
    changes: FallChange[];
}

/** Гравитация: сдвигает тайлы вниз на место пустых ячеек. Мутирует BoardModel. */
export class FallLogic {

    apply(board: BoardModel): FallResult {
        const changes: FallChange[] = [];

        for (let c = 0; c < board.cols; c++) {
            let emptyRow = board.rows - 1;

            for (let r = board.rows - 1; r >= 0; r--) {
                const tile = board.getTile(r, c)!;

                if (!tile.isEmpty) {
                    if (emptyRow !== r) {
                        const target = board.getTile(emptyRow, c)!;

                        changes.push({
                            from: { row: r,       col: c },
                            to:   { row: emptyRow, col: c },
                        });

                        target.copyFrom(tile);
                        tile.setEmpty();
                    }
                    emptyRow--;
                }
            }
        }

        return { changes };
    }
}
