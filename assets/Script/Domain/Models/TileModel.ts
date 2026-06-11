import { TileType, SuperTileType } from './TileType';

/** Данные одного тайла на поле: позиция, цвет, тип супер-тайла. */
export class TileModel {
    constructor(
        public row:       number,
        public col:       number,
        public type:      TileType,
        public superType: SuperTileType = SuperTileType.None,
    ) {}

    get isEmpty(): boolean {
        return this.type === TileType.Empty;
    }

    get isSuper(): boolean {
        return this.superType !== SuperTileType.None;
    }

    setEmpty(): void {
        this.type      = TileType.Empty;
        this.superType = SuperTileType.None;
    }

    copyFrom(other: TileModel): void {
        this.type      = other.type;
        this.superType = other.superType;
    }
}
