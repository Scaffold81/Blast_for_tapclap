import { IBoardGenerator }  from './IBoardGenerator';
import { BoardModel }        from '../../Domain/Models/BoardModel';
import { TileType }          from '../../Domain/Models/TileType';
import { IBoardConfig }      from '../../Config/BoardConfig';
import { ShuffleLogic }      from '../../Domain/Logic/ShuffleLogic';

/** Генерирует случайное игровое поле. Гарантирует наличие хода при старте. */
export class BoardGenerator implements IBoardGenerator {

    private shuffle: ShuffleLogic = new ShuffleLogic();

    generate(config: IBoardConfig): BoardModel {
        const allColors: TileType[] = [
            'blue'   as TileType,
            'green'  as TileType,
            'yellow' as TileType,
            'red'    as TileType,
            'purple' as TileType,
        ];

        const colors = allColors.slice(0, config.colorCount);
        let board: BoardModel;
        let attempts = 0;

        do {
            board = this.fill(config, colors);
            attempts++;
        } while (!this.shuffle.hasValidGroup(board, config.minGroupSize) && attempts < 100);

        return board;
    }

    private fill(config: IBoardConfig, colors: TileType[]): BoardModel {
        const board = new BoardModel(config.rows, config.cols);

        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                const type = colors[Math.floor(Math.random() * colors.length)];
                board.setTile(r, c, type);
            }
        }

        return board;
    }
}
