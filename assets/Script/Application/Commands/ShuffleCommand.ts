import { ICommand }     from './ICommand';
import { BoardModel }   from '../../Domain/Models/BoardModel';
import { ShuffleLogic } from '../../Domain/Logic/ShuffleLogic';
import { eventBus }     from '../../Core/Events/EventBus';

/** Перемешивает поле когда нет доступных ходов. */
export class ShuffleCommand implements ICommand {

    constructor(
        private board:        BoardModel,
        private shuffle:      ShuffleLogic,
        private shufflesLeft: number,
        private onDone:       (shufflesLeft: number) => void,
    ) {}

    execute(): void {
        if (this.shufflesLeft <= 0) return;

        this.shuffle.shuffle(this.board);
        this.shufflesLeft--;

        this.onDone(this.shufflesLeft);
        eventBus.emit('shuffle:complete', { shufflesLeft: this.shufflesLeft });
    }
}
