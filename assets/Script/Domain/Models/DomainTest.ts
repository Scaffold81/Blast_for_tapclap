import { TileType, SuperTileType } from '../Models/TileType';
import { TileModel }               from '../Models/TileModel';
import { BoardModel }              from '../Models/BoardModel';
import { ScoreModel }              from '../Models/ScoreModel';

const { ccclass } = cc._decorator;

@ccclass
export class DomainTest extends cc.Component {

    onLoad(): void {
        cc.log('[DomainTest] ---');
        cc.log('[DomainTest] Запуск тестов Domain Models...');

        let passed = 0;
        let failed = 0;

        const assert = (condition: boolean, message: string): void => {
            if (condition) {
                cc.log(`[DomainTest] PASS ${message}`);
                passed++;
            } else {
                cc.error(`[DomainTest] FAIL ${message}`);
                failed++;
            }
        };

        {
            const tile = new TileModel(1, 2, TileType.Blue);

            assert(tile.row       === 1,                  'TileModel: row = 1');
            assert(tile.col       === 2,                  'TileModel: col = 2');
            assert(tile.type      === TileType.Blue,      'TileModel: type = Blue');
            assert(tile.superType === SuperTileType.None, 'TileModel: superType = None по умолчанию');
            assert(!tile.isSuper,                         'TileModel: isSuper = false');
            assert(!tile.isEmpty,                         'TileModel: isEmpty = false');
        }

        {
            const tile = new TileModel(0, 0, TileType.Red, SuperTileType.Bomb);

            assert(tile.isSuper,                          'TileModel: isSuper = true');
            assert(tile.superType === SuperTileType.Bomb, 'TileModel: superType = Bomb');
        }

        {
            const tile = new TileModel(0, 0, TileType.Green, SuperTileType.Row);
            tile.setEmpty();

            assert(tile.isEmpty,                          'TileModel: setEmpty — isEmpty = true');
            assert(!tile.isSuper,                         'TileModel: setEmpty — isSuper = false');
            assert(tile.superType === SuperTileType.None, 'TileModel: setEmpty — superType = None');
        }

        {
            const src  = new TileModel(0, 0, TileType.Yellow, SuperTileType.Col);
            const dest = new TileModel(1, 1, TileType.Empty);
            dest.copyFrom(src);

            assert(dest.type      === TileType.Yellow,   'TileModel: copyFrom — type скопирован');
            assert(dest.superType === SuperTileType.Col, 'TileModel: copyFrom — superType скопирован');
            assert(dest.row       === 1,                 'TileModel: copyFrom — row не изменился');
            assert(dest.col       === 1,                 'TileModel: copyFrom — col не изменился');
        }

        {
            const board = new BoardModel(9, 7);

            assert(board.rows === 9, 'BoardModel: rows = 9');
            assert(board.cols === 7, 'BoardModel: cols = 7');
        }

        {
            const board = new BoardModel(3, 3);
            const all   = board.getAllTiles();

            assert(all.length === 9,          'BoardModel: getAllTiles — 9 тайлов');
            assert(all.every(t => t.isEmpty), 'BoardModel: все тайлы Empty после создания');
        }

        {
            const board = new BoardModel(5, 5);
            board.setTile(2, 3, TileType.Red);

            const tile = board.getTile(2, 3);
            assert(tile !== null,               'BoardModel: getTile — не null');
            assert(tile!.type === TileType.Red, 'BoardModel: getTile — type = Red');
        }

        {
            const board = new BoardModel(5, 5);

            assert(board.getTile(-1, 0) === null, 'BoardModel: getTile(-1,0) = null');
            assert(board.getTile(0, -1) === null, 'BoardModel: getTile(0,-1) = null');
            assert(board.getTile(5, 0)  === null, 'BoardModel: getTile(5,0) = null');
            assert(board.getTile(0, 5)  === null, 'BoardModel: getTile(0,5) = null');
        }

        {
            const board = new BoardModel(5, 5);

            assert(board.inBounds(0, 0),   'BoardModel: inBounds(0,0) = true');
            assert(board.inBounds(4, 4),   'BoardModel: inBounds(4,4) = true');
            assert(!board.inBounds(-1, 0), 'BoardModel: inBounds(-1,0) = false');
            assert(!board.inBounds(5, 0),  'BoardModel: inBounds(5,0) = false');
        }

        {
            const board = new BoardModel(3, 3);
            board.setTile(1, 0, TileType.Blue);
            board.setTile(1, 1, TileType.Green);
            board.setTile(1, 2, TileType.Red);

            const row = board.getRow(1);
            assert(row.length === 3,               'BoardModel: getRow — длина 3');
            assert(row[0].type === TileType.Blue,  'BoardModel: getRow[0] = Blue');
            assert(row[1].type === TileType.Green, 'BoardModel: getRow[1] = Green');
            assert(row[2].type === TileType.Red,   'BoardModel: getRow[2] = Red');

            board.setTile(0, 2, TileType.Yellow);
            board.setTile(2, 2, TileType.Purple);

            const col = board.getCol(2);
            assert(col.length === 3,                 'BoardModel: getCol — длина 3');
            assert(col[0].type === TileType.Yellow,  'BoardModel: getCol[0] = Yellow');
            assert(col[1].type === TileType.Red,     'BoardModel: getCol[1] = Red');
            assert(col[2].type === TileType.Purple,  'BoardModel: getCol[2] = Purple');
        }

        {
            const board      = new BoardModel(5, 5);
            const neighbours = board.getNeighbours(0, 0);

            assert(neighbours.length === 2, 'BoardModel: getNeighbours угол — 2 соседа');
        }

        {
            const board      = new BoardModel(5, 5);
            const neighbours = board.getNeighbours(2, 2);

            assert(neighbours.length === 4, 'BoardModel: getNeighbours центр — 4 соседа');
        }

        {
            const board      = new BoardModel(5, 5);
            const neighbours = board.getNeighbours(0, 2);

            assert(neighbours.length === 3, 'BoardModel: getNeighbours край — 3 соседа');
        }

        {
            const score = new ScoreModel(500, 30);

            assert(score.score       === 0,   'ScoreModel: score = 0');
            assert(score.movesLeft   === 30,  'ScoreModel: movesLeft = 30');
            assert(score.targetScore === 500, 'ScoreModel: targetScore = 500');
            assert(!score.isWin,              'ScoreModel: isWin = false');
            assert(!score.isLose,             'ScoreModel: isLose = false');
        }

        {
            const score = new ScoreModel(500, 30);
            score.addScore(100);
            score.addScore(50);

            assert(score.score === 150, 'ScoreModel: addScore — score = 150');
        }

        {
            const score = new ScoreModel(500, 3);
            score.spendMove();
            score.spendMove();

            assert(score.movesLeft === 1, 'ScoreModel: spendMove — movesLeft = 1');
        }

        {
            const score = new ScoreModel(500, 1);
            score.spendMove();
            score.spendMove();

            assert(score.movesLeft === 0, 'ScoreModel: spendMove не уходит в минус');
        }

        {
            const score = new ScoreModel(100, 10);
            score.addScore(100);

            assert(score.isWin,   'ScoreModel: isWin = true при score >= target');
            assert(!score.isLose, 'ScoreModel: isLose = false при победе');
        }

        {
            const score = new ScoreModel(500, 1);
            score.spendMove();

            assert(!score.isWin,  'ScoreModel: isWin = false');
            assert(score.isLose,  'ScoreModel: isLose = true при 0 ходах без победы');
        }

        {
            const score = new ScoreModel(500, 30);
            score.addScore(200);
            score.spendMove();
            score.reset(300, 15);

            assert(score.score       === 0,   'ScoreModel: reset — score = 0');
            assert(score.movesLeft   === 15,  'ScoreModel: reset — movesLeft = 15');
            assert(score.targetScore === 300, 'ScoreModel: reset — targetScore = 300');
        }

        cc.log('[DomainTest] ---');
        cc.log(`[DomainTest] Итог: ${passed} passed, ${failed} failed`);

        if (failed === 0) {
            cc.log('[DomainTest] Все тесты прошли успешно!');
        } else {
            cc.error(`[DomainTest] Провалено тестов: ${failed}`);
        }

        cc.log('[DomainTest] ---');
    }
}
