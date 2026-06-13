import { IState } from '../../Core/FSM/IState';

/** Ожидание тапа игрока для применения бустера. */
export class BoosterAimingState implements IState {
    enter(): void { cc.log('[FSM] → BoosterAiming'); }
    exit():  void {}
}
