import { TileModel } from './TileModel';
import { TileType, SuperTileType } from './TileType';

/** Игровое поле: двумерная сетка тайлов с доступом по координатам. */
export class BoardModel {
    readonly rows: number;
    readonly cols: number;

    private grid: TileModel[][];

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];

        for (let r = 0; r < rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < cols; c++) {
                this.grid[r][c] = new TileModel(r, c, TileType.Empty);
            }
        }
    }

    getTile(row: number, col: number): TileModel | null {
        if (!this.inBounds(row, col)) return null;
        return this.grid[row][col];
    }

    setTile(row: number, col: number, type: TileType, superType: SuperTileType = SuperTileType.None): void {
        if (!this.inBounds(row, col)) return;
        this.grid[row][col].type      = type;
        this.grid[row][col].superType = superType;
    }

    inBounds(row: number, col: number): boolean {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    getRow(row: number): TileModel[] {
        if (row < 0 || row >= this.rows) return [];
        return [...this.grid[row]];
    }

    getCol(col: number): TileModel[] {
        if (col < 0 || col >= this.cols) return [];
        return this.grid.map(row => row[col]);
    }

    getAllTiles(): TileModel[] {
        const result: TileModel[] = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                result.push(this.grid[r][c]);
            }
        }
        return result;
    }

    getNeighbours(row: number, col: number): TileModel[] {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const result: TileModel[] = [];

        for (const [dr, dc] of directions) {
            const tile = this.getTile(row + dr, col + dc);
            if (tile) result.push(tile);
        }

        return result;
    }
}
