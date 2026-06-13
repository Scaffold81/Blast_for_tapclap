import { IBooster }   from './IBooster';
import { TileModel }  from '../../Domain/Models/TileModel';
import { BoardModel } from '../../Domain/Models/BoardModel';
import { ScoreModel } from '../../Domain/Models/ScoreModel';
import { IGameConfig } from '../../Config/GameConfig';
import { IBoosterConfig } from '../../Config/BoosterConfig';
import { BoosterBombCommand } from '../Commands/BoosterBombCommand';

/** Бустер-бомба: 1 тап → взрыв в радиусе вокруг тайла. */
export class BombBooster implements IBooster {
    readonly type         = 'bomb';
    readonly tapsRequired = 1;

    constructor(private boosterConfig: IBoosterConfig) {}

    validate(tiles: TileModel[], _board: BoardModel): boolean {
        return tiles.length === 1 && !tiles[0].isEmpty;
    }

    execute(tiles: TileModel[], board: BoardModel, score: ScoreModel, config: IGameConfig): void {
        const tile = tiles[0];
        new BoosterBombCommand(board, score, config, tile.row, tile.col, this.boosterConfig.bombRadius).execute();
    }
}
