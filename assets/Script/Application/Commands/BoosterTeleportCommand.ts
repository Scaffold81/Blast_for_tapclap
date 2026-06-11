import { ICommand }   from './ICommand';
import { BoardModel } from '../../Domain/Models/BoardModel';

/** Меняет два тайла местами. */
export class BoosterTeleportCommand implements ICommand {

    constructor(
        private board: BoardModel,
        private rowA:  number,
        private colA:  number,
        private rowB:  number,
        private colB:  number,
    ) {}

    execute(): void {
        const tileA = this.board.getTile(this.rowA, this.colA);
        const tileB = this.board.getTile(this.rowB, this.colB);

        if (!tileA || !tileB) return;

        const tmpType      = tileA.type;
        const tmpSuperType = tileA.superType;

        tileA.type      = tileB.type;
        tileA.superType = tileB.superType;
        tileB.type      = tmpType;
        tileB.superType = tmpSuperType;
    }
}
