import { container } from './Container';
import { TYPES } from './Types';

const { ccclass } = cc._decorator;

// Вешается на ноду в StartScene, гоняет тесты и самоуничтожается духовно.
@ccclass
export class DITest extends cc.Component {

    onLoad() {
        cc.log('[DITest] Запуск тестов...');
        let passed = 0;
        let failed = 0;

        const assert = (condition: boolean, message: string) => {
            if (condition) {
                cc.log(`[DITest] ✅ ${message}`);
                passed++;
            } else {
                cc.error(`[DITest] ❌ ${message}`);
                failed++;
            }
        };

        try {
            container.bind(TYPES.SaveService, () => ({ id: 'save' }));
            const service = container.get(TYPES.SaveService);
            assert(service !== null, 'bind + get: сервис получен');
        } catch (e) {
            assert(false, `bind + get: ${e.message}`);
        }

        try {
            const a = container.get(TYPES.SaveService);
            const b = container.get(TYPES.SaveService);
            assert(a === b, 'Singleton: два get возвращают один экземпляр');
        } catch (e) {
            assert(false, `Singleton: ${e.message}`);
        }

        try {
            container.bind(TYPES.PoolService, () => ({ id: 'pool' })).toTransient();
            const a = container.get(TYPES.PoolService);
            const b = container.get(TYPES.PoolService);
            assert(a !== b, 'Transient: два get возвращают разные экземпляры');
        } catch (e) {
            assert(false, `Transient: ${e.message}`);
        }

        try {
            const config = { rows: 7, cols: 7 };
            container.bindValue(TYPES.BoardConfig, config);
            const result = container.get(TYPES.BoardConfig);
            assert(result === config, 'bindValue: возвращает тот же экземпляр');
        } catch (e) {
            assert(false, `bindValue: ${e.message}`);
        }

        try {
            container.bindInterfaceTo(TYPES.BoardGenerator, () => ({ id: 'generator' }));
            const gen = container.get(TYPES.BoardGenerator);
            assert(gen !== null, 'bindInterfaceTo: сервис получен');
        } catch (e) {
            assert(false, `bindInterfaceTo: ${e.message}`);
        }

        assert(container.has(TYPES.SaveService), 'has: true для зарегистрированного токена');
        assert(!container.has(TYPES.EventBus),   'has: false для незарегистрированного токена');

        try {
            container.get(TYPES.EventBus);
            assert(false, 'get незарегистрированного токена должен бросить ошибку');
        } catch (e) {
            assert(e.message.includes('[Container]'), 'get незарегистрированного: бросает правильную ошибку');
        }

        try {
            container.unbind(TYPES.SaveService);
            assert(!container.has(TYPES.SaveService), 'unbind: токен удалён');
        } catch (e) {
            assert(false, `unbind: ${e.message}`);
        }

        container.clear();
        cc.log(`[DITest] Итог: ${passed} passed, ${failed} failed`);

        if (failed === 0) {
            cc.log('[DITest]  Все тесты прошли успешно!');
        } else {
            cc.error(`[DITest]  Провалено тестов: ${failed}`);
        }
    }
}
