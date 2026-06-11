import { BoardModel }   from '../Models/BoardModel';
import { TileType }     from '../Models/TileType';
import { BlastLogic }   from './BlastLogic';
import { FallLogic }    from './FallLogic';
import { ShuffleLogic } from './ShuffleLogic';

const { ccclass } = cc._decorator;

// JSB-workaround: TileType enum может быть undefined в onLoad @ccclass-компонента.
// Используем строковые значения напрямую.
const B = 'blue'   as TileType;
const R = 'red'    as TileType;
const G = 'green'  as TileType;
const Y = 'yellow' as TileType;
const P = 'purple' as TileType;

@ccclass
export class LogicTest extends cc.Component {

    onLoad(): void {
        cc.log('[LogicTest] ---');
        cc.log('[LogicTest] Запуск тестов Domain Logic...');

        let passed = 0;
        let failed = 0;

        const assert = (condition: boolean, message: string): void => {
            if (condition) {
                cc.log(`[LogicTest] PASS ${message}`);
                passed++;
            } else {
                cc.error(`[LogicTest] FAIL ${message}`);
                failed++;
            }
        };

        const blast   = new BlastLogic();
        const fall    = new FallLogic();
        const shuffle = new ShuffleLogic();

        {
            const board = new BoardModel(3, 3);
            board.setTile(0, 0, B);
            board.setTile(0, 1, B);
            board.setTile(1, 0, B);

            const result = blast.findGroup(board, 0, 0, 2);

            assert(result.isValid,            'BlastLogic: группа из 3 — isValid = true');
            assert(result.tiles.length === 3, 'BlastLogic: группа из 3 — длина = 3');
        }

        {
            const board = new BoardModel(2, 2);
            board.setTile(0, 0, B);

            const result = blast.findGroup(board, 0, 0, 2);

            assert(!result.isValid,           'BlastLogic: одиночный тайл — isValid = false');
            assert(result.tiles.length === 1, 'BlastLogic: одиночный тайл — длина = 1');
        }

        {
            const board = new BoardModel(3, 3);
            for (let r = 0; r < 3; r++) {
                board.setTile(r, 0, B);
                board.setTile(r, 1, R);
                board.setTile(r, 2, B);
            }

            const blueResult = blast.findGroup(board, 0, 0, 2);
            const redResult  = blast.findGroup(board, 0, 1, 2);

            assert(blueResult.tiles.length === 3,            'BlastLogic: разделённые цвета — Blue группа = 3');
            assert(redResult.tiles.length  === 3,            'BlastLogic: разделённые цвета — Red группа = 3');
            assert(blueResult.tiles.every(t => t.type === B),'BlastLogic: в Blue группе только Blue тайлы');
        }

        {
            const board  = new BoardModel(3, 3);
            const result = blast.findGroup(board, 1, 1, 2);

            assert(!result.isValid,           'BlastLogic: клик по Empty — isValid = false');
            assert(result.tiles.length === 0, 'BlastLogic: клик по Empty — длина = 0');
        }

        {
            const board  = new BoardModel(3, 3);
            const result = blast.findGroup(board, -1, 0, 2);

            assert(!result.isValid,           'BlastLogic: клик вне поля — isValid = false');
            assert(result.tiles.length === 0, 'BlastLogic: клик вне поля — длина = 0');
        }

        {
            const board = new BoardModel(2, 5);
            for (let r = 0; r < 2; r++)
                for (let c = 0; c < 5; c++)
                    board.setTile(r, c, G);

            const result = blast.findGroup(board, 0, 0, 2);

            assert(result.tiles.length === 10, 'BlastLogic: вся доска одного цвета — группа = 10');
            assert(result.isValid,             'BlastLogic: вся доска одного цвета — isValid = true');
        }

        {
            const board  = new BoardModel(3, 1);
            board.setTile(0, 0, B);

            const result = fall.apply(board);

            assert(board.getTile(2, 0)!.type === B, 'FallLogic: тайл упал вниз');
            assert(board.getTile(0, 0)!.isEmpty,     'FallLogic: верхняя ячейка стала Empty');
            assert(result.changes.length === 1,      'FallLogic: 1 изменение');
            assert(result.changes[0].from.row === 0, 'FallLogic: from.row = 0');
            assert(result.changes[0].to.row   === 2, 'FallLogic: to.row = 2');
        }

        {
            const board = new BoardModel(3, 1);
            board.setTile(0, 0, B);
            board.setTile(2, 0, R);

            const result = fall.apply(board);

            assert(board.getTile(1, 0)!.type === B, 'FallLogic: Blue упал на позицию 1');
            assert(board.getTile(2, 0)!.type === R, 'FallLogic: Red остался на позиции 2');
            assert(board.getTile(0, 0)!.isEmpty,     'FallLogic: позиция 0 стала Empty');
            assert(result.changes.length === 1,      'FallLogic: 1 изменение');
        }

        {
            const board = new BoardModel(3, 1);
            board.setTile(0, 0, B);
            board.setTile(1, 0, R);
            board.setTile(2, 0, G);

            const result = fall.apply(board);

            assert(result.changes.length === 0, 'FallLogic: нет пустых — нет изменений');
        }

        {
            const board  = new BoardModel(3, 3);
            const result = fall.apply(board);

            assert(result.changes.length === 0, 'FallLogic: пустая доска — нет изменений');
        }

        {
            const board = new BoardModel(6, 1);
            board.setTile(0, 0, B);
            board.setTile(3, 0, R);
            board.setTile(5, 0, G);

            fall.apply(board);

            assert(board.getTile(5, 0)!.type === G, 'FallLogic: несколько пустых — Green на дне');
            assert(board.getTile(4, 0)!.type === R, 'FallLogic: несколько пустых — Red выше Green');
            assert(board.getTile(3, 0)!.type === B, 'FallLogic: несколько пустых — Blue выше Red');
        }

        {
            const board = new BoardModel(2, 3);
            for (let r = 0; r < 2; r++)
                for (let c = 0; c < 3; c++)
                    board.setTile(r, c, B);

            assert(shuffle.hasValidGroup(board, 2), 'ShuffleLogic: hasValidGroup — есть группа = true');
        }

        {
            const board  = new BoardModel(3, 3);
            const types  = [B, R];
            for (let r = 0; r < 3; r++)
                for (let c = 0; c < 3; c++)
                    board.setTile(r, c, types[(r + c) % 2]);

            assert(!shuffle.hasValidGroup(board, 2), 'ShuffleLogic: hasValidGroup — шахматка = false');
        }

        {
            const board = new BoardModel(2, 2);

            assert(!shuffle.hasValidGroup(board, 2), 'ShuffleLogic: hasValidGroup — пустая доска = false');
        }

        {
            const board = new BoardModel(2, 3);
            board.setTile(0, 0, B);
            board.setTile(0, 1, R);
            board.setTile(0, 2, G);
            board.setTile(1, 0, Y);
            board.setTile(1, 1, P);
            board.setTile(1, 2, B);

            const before = board.getAllTiles()
                .filter(t => !t.isEmpty)
                .map(t => t.type)
                .sort()
                .join(',');

            shuffle.shuffle(board);

            const after = board.getAllTiles()
                .filter(t => !t.isEmpty)
                .map(t => t.type)
                .sort()
                .join(',');

            assert(before === after, 'ShuffleLogic: shuffle — состав тайлов не меняется');
        }

        {
            const board = new BoardModel(2, 2);
            board.setTile(0, 0, B);
            board.setTile(1, 1, R);

            shuffle.shuffle(board);

            const empties = board.getAllTiles().filter(t => t.isEmpty);
            assert(empties.length === 2, 'ShuffleLogic: shuffle — Empty-ячейки не заполняются');
        }

        cc.log('[LogicTest] ---');
        cc.log(`[LogicTest] Итог: ${passed} passed, ${failed} failed`);

        if (failed === 0) {
            cc.log('[LogicTest] Все тесты прошли успешно!');
        } else {
            cc.error(`[LogicTest] Провалено тестов: ${failed}`);
        }

        cc.log('[LogicTest] ---');
    }
}
