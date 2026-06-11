import { IState } from '../../Core/FSM/IState';

/** Проверка условий победы и поражения после каждого хода. */
export class CheckWinState implements IState {
    enter(): void { cc.log('[FSM] → CheckWin'); }
    exit():  void {}
}
