import { IState } from '../../Core/FSM/IState';

/** Обработка взрыва. Ввод заблокирован. */
export class ProcessingState implements IState {
    enter(): void { cc.log('[FSM] → Processing'); }
    exit():  void {}
}
