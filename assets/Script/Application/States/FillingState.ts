import { IState } from '../../Core/FSM/IState';

/** Заполнение пустых ячеек новыми тайлами. */
export class FillingState implements IState {
    enter(): void { cc.log('[FSM] → Filling'); }
    exit():  void {}
}
