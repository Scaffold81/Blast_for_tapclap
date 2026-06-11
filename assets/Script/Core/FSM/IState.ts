/** Контракт состояния для FSM. Каждое состояние реализует вход и выход. */
export interface IState {
    enter(): void;
    exit(): void;
}
