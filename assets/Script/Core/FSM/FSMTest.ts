import { StateMachine } from './StateMachine';
import { IState } from './IState';

const { ccclass } = cc._decorator;

@ccclass
export class FSMTest extends cc.Component {

    onLoad(): void {
        cc.log('[FSMTest] ---');
        cc.log('[FSMTest] Запуск тестов StateMachine...');

        let passed = 0;
        let failed = 0;

        const assert = (condition: boolean, message: string): void => {
            if (condition) {
                cc.log(`[FSMTest] PASS ${message}`);
                passed++;
            } else {
                cc.error(`[FSMTest] FAIL ${message}`);
                failed++;
            }
        };

        const makeState = () => {
            const state = {
                enterCount: 0,
                exitCount:  0,
                enter() { this.enterCount++; },
                exit()  { this.exitCount++;  },
            };
            return state;
        };

        {
            const fsm  = new StateMachine();
            const idle = makeState();

            fsm.register('Idle', idle);
            fsm.enter('Idle');

            assert(idle.enterCount === 1, 'register+enter: enter вызван 1 раз');
            assert(idle.exitCount  === 0, 'register+enter: exit не вызван');
        }

        {
            const fsm        = new StateMachine();
            const idle       = makeState();
            const processing = makeState();

            fsm.register('Idle',       idle);
            fsm.register('Processing', processing);

            fsm.enter('Idle');
            fsm.enter('Processing');

            assert(idle.exitCount        === 1, 'switch: exit у Idle вызван');
            assert(processing.enterCount === 1, 'switch: enter у Processing вызван');
            assert(idle.enterCount       === 1, 'switch: повторный enter у Idle не вызван');
        }

        {
            const fsm  = new StateMachine();
            const idle = makeState();

            fsm.register('Idle', idle);
            fsm.enter('Idle');
            fsm.enter('Idle');

            assert(idle.enterCount === 1, 'same state: enter вызван только 1 раз');
            assert(idle.exitCount  === 0, 'same state: exit не вызван');
        }

        {
            const fsm     = new StateMachine();
            const idle    = makeState();
            const falling = makeState();

            fsm.register('Idle',    idle);
            fsm.register('Falling', falling);
            fsm.enter('Idle');

            assert(fsm.is('Idle'),     'is: Idle — true для текущего');
            assert(!fsm.is('Falling'), 'is: Falling — false для не текущего');
        }

        {
            const fsm        = new StateMachine();
            const idle       = makeState();
            const processing = makeState();

            fsm.register('Idle',       idle);
            fsm.register('Processing', processing);

            fsm.enter('Idle');
            assert(fsm.getCurrentName() === 'Idle', 'getCurrentName: Idle после входа в Idle');

            fsm.enter('Processing');
            assert(fsm.getCurrentName() === 'Processing', 'getCurrentName: Processing после переключения');
        }

        {
            const fsm        = new StateMachine();
            const idle       = makeState();
            const processing = makeState();
            const falling    = makeState();
            const filling    = makeState();
            const checkWin   = makeState();
            const gameOver   = makeState();

            fsm.register('Idle',       idle);
            fsm.register('Processing', processing);
            fsm.register('Falling',    falling);
            fsm.register('Filling',    filling);
            fsm.register('CheckWin',   checkWin);
            fsm.register('GameOver',   gameOver);

            fsm.enter('Idle');
            fsm.enter('Processing');
            fsm.enter('Falling');
            fsm.enter('Filling');
            fsm.enter('CheckWin');
            fsm.enter('GameOver');

            assert(fsm.is('GameOver'),         'chain: финальное состояние GameOver');
            assert(idle.exitCount       === 1, 'chain: Idle.exit вызван 1 раз');
            assert(processing.exitCount === 1, 'chain: Processing.exit вызван 1 раз');
            assert(falling.exitCount    === 1, 'chain: Falling.exit вызван 1 раз');
            assert(filling.exitCount    === 1, 'chain: Filling.exit вызван 1 раз');
            assert(checkWin.exitCount   === 1, 'chain: CheckWin.exit вызван 1 раз');
            assert(gameOver.exitCount   === 0, 'chain: GameOver.exit не вызван — конечное');
        }

        {
            const fsm = new StateMachine();

            try {
                fsm.enter('NonExistent');
                assert(false, 'unknown state: должна была броситься ошибка');
            } catch (e) {
                assert(
                    e.message.includes('[StateMachine]'),
                    'unknown state: бросает правильную ошибку'
                );
            }
        }

        cc.log('[FSMTest] ---');
        cc.log(`[FSMTest] Итог: ${passed} passed, ${failed} failed`);

        if (failed === 0) {
            cc.log('[FSMTest] Все тесты прошли успешно!');
        } else {
            cc.error(`[FSMTest] Провалено тестов: ${failed}`);
        }

        cc.log('[FSMTest] ---');
    }
}
