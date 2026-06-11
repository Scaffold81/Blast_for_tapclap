import { IState } from '../../Core/FSM/IState';

/** Ожидание ввода игрока. Единственное состояние где клики обрабатываются. */
export class IdleState implements IState {
    enter(): void { cc.log('[FSM] → Idle'); }
    exit():  void {}
}
