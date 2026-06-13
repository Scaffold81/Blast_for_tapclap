import { TileModel } from '../../Domain/Models/TileModel';
import { BoardModel } from '../../Domain/Models/BoardModel';
import { ScoreModel } from '../../Domain/Models/ScoreModel';
import { IGameConfig } from '../../Config/GameConfig';

/** Контракт бустера. Каждый бустер знает сколько тапов нужно, как их валидировать и как применить. */
export interface IBooster {
    readonly type:         string;
    readonly tapsRequired: number;
    validate(tiles: TileModel[], board: BoardModel): boolean;
    execute(tiles: TileModel[], board: BoardModel, score: ScoreModel, config: IGameConfig): void;
}
