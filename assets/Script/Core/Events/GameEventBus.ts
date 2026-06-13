import { EventBus } from './EventBus';
import { GameEventMap } from './GameEvents';

/** Глобальный экземпляр шины событий для игры. */
export const eventBus = new EventBus<GameEventMap>();
