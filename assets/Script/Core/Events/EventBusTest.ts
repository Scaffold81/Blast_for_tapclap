import { EventBus, eventBus } from '../Events/EventBus';
import { GameEventMap } from '../Events/GameEvents';
import { TileModel }    from '../../Domain/Models/TileModel';
import { TileType }     from '../../Domain/Models/TileType';

const { ccclass } = cc._decorator;

@ccclass
export class EventBusTest extends cc.Component {

    onLoad(): void {
        cc.log('[EventBusTest] ---');
        cc.log('[EventBusTest] Запуск тестов EventBus...');

        let passed = 0;
        let failed = 0;

        const assert = (condition: boolean, message: string): void => {
            if (condition) {
                cc.log(`[EventBusTest] PASS ${message}`);
                passed++;
            } else {
                cc.error(`[EventBusTest] FAIL ${message}`);
                failed++;
            }
        };

        {
            const bus = new EventBus();
            let received: GameEventMap['score:changed'] | null = null;

            bus.on('score:changed', data => { received = data; });
            bus.emit('score:changed', { score: 42, delta: 10 });

            assert(received !== null,      'on+emit: хендлер вызван');
            assert(received!.score === 42, 'on+emit: score = 42');
            assert(received!.delta === 10, 'on+emit: delta = 10');
        }

        {
            const bus = new EventBus();
            let called = false;

            bus.on('game:restart', () => { called = true; });
            bus.emit('game:restart');

            assert(called, 'void payload: хендлер вызван без аргументов');
        }

        {
            const bus  = new EventBus();
            const RED  = 'red' as TileType;
            const tile = new TileModel(2, 3, RED);
            let receivedTile: TileModel | null = null;

            bus.on('blast:complete', data => { receivedTile = data.clickedTile; });
            bus.emit('blast:complete', { tiles: [tile], clickedTile: tile });

            assert(receivedTile !== null,      'TileModel payload: хендлер вызван');
            assert(receivedTile!.row === 2,    'TileModel payload: row = 2');
            assert(receivedTile!.col === 3,    'TileModel payload: col = 3');
            assert(receivedTile!.type === RED, 'TileModel payload: type = Red');
        }

        {
            const bus = new EventBus();
            let count = 0;

            const h1 = () => { count++; };
            const h2 = () => { count++; };
            const h3 = () => { count++; };

            bus.on('game:restart', h1);
            bus.on('game:restart', h2);
            bus.on('game:restart', h3);
            bus.emit('game:restart');

            assert(count === 3, `Несколько подписчиков: вызваны все (count = ${count}, ожидаем 3)`);
        }

        {
            const bus = new EventBus();
            let count = 0;

            const handler = () => { count++; };

            bus.on('game:restart', handler);
            bus.on('game:restart', handler);
            bus.emit('game:restart');

            assert(count === 1, `Дубль хендлера: вызван ровно 1 раз (count = ${count})`);
        }

        {
            const bus = new EventBus();
            let count = 0;
            const handler = (_data: GameEventMap['moves:changed']) => { count++; };

            bus.on('moves:changed', handler);
            bus.emit('moves:changed', { movesLeft: 5 });
            assert(count === 1, 'off: до отписки хендлер вызван');

            bus.off('moves:changed', handler);
            bus.emit('moves:changed', { movesLeft: 4 });
            assert(count === 1, 'off: после отписки хендлер не вызывается');
        }

        {
            const bus = new EventBus();
            let count = 0;

            bus.once('game:win', () => { count++; });
            bus.emit('game:win', { score: 100, movesLeft: 3 });
            bus.emit('game:win', { score: 200, movesLeft: 2 });
            bus.emit('game:win', { score: 300, movesLeft: 1 });

            assert(count === 1, `once: сработал ровно 1 раз (count = ${count})`);
        }

        {
            const bus = new EventBus();
            let scoreCount = 0;
            let movesCount = 0;
            let loseCount  = 0;

            const onScore = (_data: GameEventMap['score:changed']) => { scoreCount++; };
            const onMoves = (_data: GameEventMap['moves:changed']) => { movesCount++; };
            const onLose  = (_data: GameEventMap['game:lose'])     => { loseCount++;  };

            bus.on('score:changed', onScore);
            bus.on('moves:changed', onMoves);
            bus.on('game:lose',     onLose);

            bus.offAll(onScore);
            bus.offAll(onMoves);
            bus.offAll(onLose);

            bus.emit('score:changed', { score: 1, delta: 1 });
            bus.emit('moves:changed', { movesLeft: 1 });
            bus.emit('game:lose',     { reason: 'no_moves' });

            assert(scoreCount === 0, 'offAll: score хендлер снят');
            assert(movesCount === 0, 'offAll: moves хендлер снят');
            assert(loseCount  === 0, 'offAll: lose хендлер снят');
        }

        {
            const bus = new EventBus();
            let called = false;

            bus.on('game:win', () => { called = true; });
            bus.clear();
            bus.emit('game:win', { score: 999, movesLeft: 0 });

            assert(!called, 'clear: после очистки хендлеры не вызываются');
        }

        {
            let globalCalled = false;
            let localCalled  = false;

            const localBus = new EventBus();

            eventBus.on('game:restart', () => { globalCalled = true; });
            localBus.on('game:restart', () => { localCalled  = true; });

            eventBus.emit('game:restart');

            assert(globalCalled,  'Изоляция: глобальный eventBus сработал');
            assert(!localCalled,  'Изоляция: локальный bus не затронут');

            eventBus.clear();
        }

        cc.log('[EventBusTest] ---');
        cc.log(`[EventBusTest] Итог: ${passed} passed, ${failed} failed`);

        if (failed === 0) {
            cc.log('[EventBusTest] Все тесты прошли успешно!');
        } else {
            cc.error(`[EventBusTest] Провалено тестов: ${failed}`);
        }

        cc.log('[EventBusTest] ---');
    }
}
