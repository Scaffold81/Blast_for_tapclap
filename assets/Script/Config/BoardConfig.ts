export interface IBoardConfig {
    cols:                 number;
    rows:                 number;
    colorCount:           number;
    minGroupSize:         number;
    superTileThreshold:   number;
    tileSize:             number;
    tileSpacing:          number;
}

export const BoardConfig: IBoardConfig = {
    cols:               7,
    rows:               8,
    colorCount:         5,
    minGroupSize:       2,
    superTileThreshold: 5,
    tileSize:           50,
    tileSpacing:        20,
};
