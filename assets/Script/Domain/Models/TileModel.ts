/** Заглушка — будет расширена в Итерации 5 */

export enum TileType {
    Blue    = 'blue',
    Green   = 'green',
    Yellow  = 'yellow',
    Red     = 'red',
    Purple  = 'purple',
    Empty   = 'empty',
}

export class TileModel {
    constructor(
        public row:     number,
        public col:     number,
        public type:    TileType,
        public isSuper: boolean = false,
    ) {}

    get isEmpty(): boolean {
        return this.type === TileType.Empty;
    }
}
