import { BoardModel }  from '../../Domain/Models/BoardModel';
import { IBoardConfig } from '../../Config/BoardConfig';

/** Контракт генератора игрового поля. */
export interface IBoardGenerator {
    generate(config: IBoardConfig): BoardModel;
}
