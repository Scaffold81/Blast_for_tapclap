import { BoardGenerator }  from './BoardGenerator';
import { BoardConfig }     from '../../Config/BoardConfig';
import { ShuffleLogic }    from '../../Domain/Logic/ShuffleLogic';

const { ccclass } = cc._decorator;

@ccclass
export class GeneratorTest extends cc.Component {

    onLoad(): void {
        cc.log('[GeneratorTest] ---');
        cc.log('[GeneratorTest] Запуск тестов BoardGenerator...');

        let passed = 0;
        let failed = 0;

        const assert = (condition: boolean, message: string): void => {
            if (condition) {
                cc.log(`[GeneratorTest] PASS ${message}`);
                passed++;
            } else {
                cc.error(`[GeneratorTest] FAIL ${message}`);
                failed++;
            }
        };

        const generator = new BoardGenerator();
        const shuffle   = new ShuffleLogic();

        {
            const board = generator.generate(BoardConfig);

            assert(board.rows === BoardConfig.rows, `BoardGenerator: rows = ${BoardConfig.rows}`);
            assert(board.cols === BoardConfig.cols, `BoardGenerator: cols = ${BoardConfig.cols}`);
        }

        {
            const board = generator.generate(BoardConfig);
            const all   = board.getAllTiles();

            assert(all.every(t => !t.isEmpty), 'BoardGenerator: все тайлы заполнены');
        }

        {
            const board      = generator.generate(BoardConfig);
            const colorSet: { [key: string]: boolean } = {};
            board.getAllTiles().forEach(t => { colorSet[t.type] = true; });
            const colorCount = Object.keys(colorSet).length;

            assert(colorCount > 1, `BoardGenerator: использовано несколько цветов (${colorCount})`);
        }

        {
            const board = generator.generate(BoardConfig);
            const valid = shuffle.hasValidGroup(board, BoardConfig.minGroupSize);

            assert(valid, 'BoardGenerator: на старте есть валидная группа');
        }

        {
            const config        = { cols: 7, rows: 9, colorCount: 2, minGroupSize: 2, superTileThreshold: 5, tileSize: 80, tileSpacing: 4 };
            const board         = generator.generate(config);
            const allowed       = { blue: true, green: true };
            const allAllowed    = board.getAllTiles().every(t => !!(allowed as any)[t.type]);

            assert(allAllowed, 'BoardGenerator: colorCount=2 — только Blue и Green');
        }

        {
            const board1 = generator.generate(BoardConfig);
            const board2 = generator.generate(BoardConfig);

            const types1 = board1.getAllTiles().map(t => t.type).join(',');
            const types2 = board2.getAllTiles().map(t => t.type).join(',');

            assert(types1 !== types2, 'BoardGenerator: два поля не идентичны (случайность)');
        }

        cc.log('[GeneratorTest] ---');
        cc.log(`[GeneratorTest] Итог: ${passed} passed, ${failed} failed`);

        if (failed === 0) {
            cc.log('[GeneratorTest] Все тесты прошли успешно!');
        } else {
            cc.error(`[GeneratorTest] Провалено тестов: ${failed}`);
        }

        cc.log('[GeneratorTest] ---');
    }
}
