import { IState } from '../../Core/FSM/IState';

/** Анимация падения тайлов после взрыва. */
export class FallingState implements IState {
    enter(): void { cc.log('[FSM] → Falling'); }
    exit():  void {}
}
