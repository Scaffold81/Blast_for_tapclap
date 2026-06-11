import { BoardModel }             from '../../Domain/Models/BoardModel';
import { ScoreModel }             from '../../Domain/Models/ScoreModel';
import { BlastLogic }             from '../../Domain/Logic/BlastLogic';
import { ShuffleLogic }           from '../../Domain/Logic/ShuffleLogic';
import { BlastCommand }           from './BlastCommand';
import { ShuffleCommand }         from './ShuffleCommand';
import { BoosterBombCommand }     from './BoosterBombCommand';
import { BoosterTeleportCommand } from './BoosterTeleportCommand';
import { SuperTileCommand }       from './SuperTileCommand';
import { eventBus }               from '../../Core/Events/EventBus';

const { ccclass } = cc._decorator;

const B = 'blue'   as any;
const R = 'red'    as any;
const G = 'green'  as any;
const Y = 'yellow' as any;

const GAME_CONFIG  = { targetScore: 500, maxMoves: 30, shuffleMaxCount: 3, scorePerTile: 10, scoreGroupBonus: 5 };
const BOARD_CONFIG = { cols: 7, rows: 9, colorCount: 5, minGroupSize: 2, superTileThreshold: 5, tileSize: 80, tileSpacing: 4 };

@ccclass
export class CommandsTest extends cc.Component {

    onLoad(): void {
        cc.log('[CommandsTest] ---');
        cc.log('[CommandsTest] Запуск тестов Commands...');

        let passed = 0;
        let failed = 0;

        const assert = (condition: boolean, message: string): void => {
            if (condition) {
                cc.log(`[CommandsTest] PASS ${message}`);
                passed++;
            } else {
                cc.error(`[CommandsTest] FAIL ${message}`);
                failed++;
            }
        };

        // ── BlastCommand ──────────────────────────────────────────────────────

        {
            const board = new BoardModel(3, 3);
            board.setTile(0, 0, B);
            board.setTile(0, 1, B);
            board.setTile(1, 0, B);
            const score = new ScoreModel(500, 10);

            new BlastCommand(board, score, new BlastLogic(), GAME_CONFIG, BOARD_CONFIG, 0, 0).execute();

            assert(board.getTile(0, 0)!.isEmpty, 'BlastCommand: тайлы взорваны');
            assert(score.score > 0,              'BlastCommand: очки начислены');
            assert(score.movesLeft === 9,        'BlastCommand: ход потрачен');
        }

        {
            const board = new BoardModel(3, 3);
            board.setTile(0, 0, B);
            const score = new ScoreModel(500, 10);

            new BlastCommand(board, score, new BlastLogic(), GAME_CONFIG, BOARD_CONFIG, 0, 0).execute();

            assert(!board.getTile(0, 0)!.isEmpty, 'BlastCommand: одиночный тайл не взрывается');
            assert(score.score === 0,             'BlastCommand: очки не начисляются');
            assert(score.movesLeft === 10,        'BlastCommand: ход не тратится');
        }

        {
            const board = new BoardModel(3, 3);
            for (let r = 0; r < 3; r++)
                for (let c = 0; c < 3; c++)
                    board.setTile(r, c, B);
            const score = new ScoreModel(500, 10);

            let blastFired = false;
            eventBus.on('blast:complete', () => { blastFired = true; });
            new BlastCommand(board, score, new BlastLogic(), GAME_CONFIG, BOARD_CONFIG, 0, 0).execute();
            eventBus.off('blast:complete', () => { blastFired = true; });

            assert(blastFired, 'BlastCommand: событие blast:complete выброшено');
        }

        {
            const board    = new BoardModel(3, 3);
            const config   = { ...BOARD_CONFIG, superTileThreshold: 3 };
            for (let r = 0; r < 3; r++)
                for (let c = 0; c < 3; c++)
                    board.setTile(r, c, B);
            const score = new ScoreModel(500, 10);

            new BlastCommand(board, score, new BlastLogic(), GAME_CONFIG, config, 1, 1).execute();

            const center = board.getTile(1, 1)!;
            assert(center.isSuper, 'BlastCommand: супер-тайл создан при группе >= threshold');
        }

        // ── ShuffleCommand ────────────────────────────────────────────────────

        {
            const board   = new BoardModel(2, 3);
            for (let r = 0; r < 2; r++)
                for (let c = 0; c < 3; c++)
                    board.setTile(r, c, B);

            let shufflesLeft = 3;
            new ShuffleCommand(board, new ShuffleLogic(), shufflesLeft, (n) => { shufflesLeft = n; }).execute();

            assert(shufflesLeft === 2, 'ShuffleCommand: shufflesLeft уменьшился');
        }

        {
            const board = new BoardModel(2, 2);
            let shufflesLeft = 0;
            let called = false;

            new ShuffleCommand(board, new ShuffleLogic(), shufflesLeft, () => { called = true; }).execute();

            assert(!called, 'ShuffleCommand: при shufflesLeft=0 onDone не вызывается');
        }

        // ── BoosterBombCommand ────────────────────────────────────────────────

        {
            const board = new BoardModel(5, 5);
            for (let r = 0; r < 5; r++)
                for (let c = 0; c < 5; c++)
                    board.setTile(r, c, R);
            const score = new ScoreModel(500, 10);

            new BoosterBombCommand(board, score, GAME_CONFIG, 2, 2, 1).execute();

            const emptied = board.getAllTiles().filter(t => t.isEmpty).length;
            assert(emptied === 9, `BoosterBombCommand: взорвано 9 тайлов в радиусе 1 (${emptied})`);
            assert(score.score === 90, `BoosterBombCommand: очки = 90 (${score.score})`);
        }

        {
            const board = new BoardModel(3, 3);
            const score = new ScoreModel(500, 10);

            new BoosterBombCommand(board, score, GAME_CONFIG, 1, 1, 1).execute();

            assert(score.score === 0, 'BoosterBombCommand: пустая доска — очки не начисляются');
        }

        // ── BoosterTeleportCommand ────────────────────────────────────────────

        {
            const board = new BoardModel(3, 3);
            board.setTile(0, 0, B);
            board.setTile(2, 2, R);

            new BoosterTeleportCommand(board, 0, 0, 2, 2).execute();

            assert(board.getTile(0, 0)!.type === R, 'BoosterTeleport: тайл A получил тип B');
            assert(board.getTile(2, 2)!.type === B, 'BoosterTeleport: тайл B получил тип A');
        }

        {
            const board = new BoardModel(2, 2);
            board.setTile(0, 0, G);
            board.setTile(0, 1, Y);

            new BoosterTeleportCommand(board, 0, 0, 0, 1).execute();

            assert(board.getTile(0, 0)!.type === Y, 'BoosterTeleport: swap в одной строке работает');
            assert(board.getTile(0, 1)!.type === G, 'BoosterTeleport: swap в одной строке работает (обратно)');
        }

        // ── SuperTileCommand ──────────────────────────────────────────────────

        {
            const board = new BoardModel(3, 5);
            for (let c = 0; c < 5; c++) board.setTile(1, c, R);
            board.setTile(1, 2, B);
            board.getTile(1, 2)!.superType = 'row' as any;
            const score = new ScoreModel(500, 10);

            new SuperTileCommand(board, score, GAME_CONFIG, 1, 2).execute();

            const rowEmpty = board.getRow(1).every(t => t.isEmpty);
            assert(rowEmpty, 'SuperTileCommand: Row — вся строка взорвана');
        }

        {
            const board = new BoardModel(5, 3);
            for (let r = 0; r < 5; r++) board.setTile(r, 1, G);
            board.setTile(2, 1, B);
            board.getTile(2, 1)!.superType = 'col' as any;
            const score = new ScoreModel(500, 10);

            new SuperTileCommand(board, score, GAME_CONFIG, 2, 1).execute();

            const colEmpty = board.getCol(1).every(t => t.isEmpty);
            assert(colEmpty, 'SuperTileCommand: Col — весь столбец взорван');
        }

        {
            const board = new BoardModel(5, 5);
            for (let r = 0; r < 5; r++)
                for (let c = 0; c < 5; c++)
                    board.setTile(r, c, Y);
            board.getTile(2, 2)!.superType = 'bomb' as any;
            const score = new ScoreModel(500, 10);

            new SuperTileCommand(board, score, GAME_CONFIG, 2, 2).execute();

            const emptied = board.getAllTiles().filter(t => t.isEmpty).length;
            assert(emptied === 25, `SuperTileCommand: Bomb — взорвано 25 тайлов в радиусе 2 (${emptied})`);
        }

        {
            const board = new BoardModel(3, 3);
            for (let r = 0; r < 3; r++)
                for (let c = 0; c < 3; c++)
                    board.setTile(r, c, R);
            board.getTile(1, 1)!.superType = 'max' as any;
            const score = new ScoreModel(500, 10);

            new SuperTileCommand(board, score, GAME_CONFIG, 1, 1).execute();

            const allEmpty = board.getAllTiles().every(t => t.isEmpty);
            assert(allEmpty, 'SuperTileCommand: Max — всё поле взорвано');
        }

        {
            const board = new BoardModel(3, 3);
            board.setTile(1, 1, R);
            const score = new ScoreModel(500, 10);

            new SuperTileCommand(board, score, GAME_CONFIG, 1, 1).execute();

            assert(score.score === 0, 'SuperTileCommand: обычный тайл — команда не выполняется');
        }

        eventBus.clear();

        cc.log('[CommandsTest] ---');
        cc.log(`[CommandsTest] Итог: ${passed} passed, ${failed} failed`);

        if (failed === 0) {
            cc.log('[CommandsTest] Все тесты прошли успешно!');
        } else {
            cc.error(`[CommandsTest] Провалено тестов: ${failed}`);
        }

        cc.log('[CommandsTest] ---');
    }
}
