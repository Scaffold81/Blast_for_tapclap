import { IBooster }   from './IBooster';
import { TileModel }  from '../../Domain/Models/TileModel';
import { BoardModel } from '../../Domain/Models/BoardModel';
import { ScoreModel } from '../../Domain/Models/ScoreModel';
import { IGameConfig } from '../../Config/GameConfig';
import { BoosterTeleportCommand } from '../Commands/BoosterTeleportCommand';

/** Бустер-свайп: 2 тапа на соседние тайлы → меняет их местами. */
export class TeleportBooster implements IBooster {
    readonly type         = 'teleport';
    readonly tapsRequired = 2;

    validate(tiles: TileModel[], _board: BoardModel): boolean {
        if (tiles.length !== 2) return false;
        const [a, b] = tiles;
        if (a.isEmpty || b.isEmpty) return false;
        const dr = Math.abs(a.row - b.row);
        const dc = Math.abs(a.col - b.col);
        return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
    }

    execute(tiles: TileModel[], board: BoardModel, score: ScoreModel, _config: IGameConfig): void {
        const [a, b] = tiles;
        new BoosterTeleportCommand(board, a.row, a.col, b.row, b.col).execute();
    }
}
