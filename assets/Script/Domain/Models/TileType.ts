/** Цвет обычного тайла. */
export enum TileType {
    Blue   = 'blue',
    Green  = 'green',
    Yellow = 'yellow',
    Red    = 'red',
    Purple = 'purple',
    Empty  = 'empty',
}

/** Тип супер-тайла, создаваемого при взрыве большой группы. */
export enum SuperTileType {
    None   = 'none',
    Row    = 'row',
    Col    = 'col',
    Bomb   = 'bomb',
    Max    = 'max',
}
