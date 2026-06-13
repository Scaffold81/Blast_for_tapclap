import { TileModel }  from '../../Domain/Models/TileModel';
import { BoardModel } from '../../Domain/Models/BoardModel';

/** Контракт эффекта супертайла. Каждый тип сам знает какие тайлы собирать. */
export interface ISuperTileEffect {
    readonly type: string;
    collect(board: BoardModel, row: number, col: number): TileModel[];
}
