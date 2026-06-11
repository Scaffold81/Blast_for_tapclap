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
    rows:               9,
    colorCount:         5,
    minGroupSize:       2,
    superTileThreshold: 5,
    tileSize:           80,
    tileSpacing:        4,
};
