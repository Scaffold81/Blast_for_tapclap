import { IState } from '../../Core/FSM/IState';

/** Игра завершена — победа или поражение. Ввод заблокирован. */
export class GameOverState implements IState {
    enter(): void { cc.log('[FSM] → GameOver'); }
    exit():  void {}
}
