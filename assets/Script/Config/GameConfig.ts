export interface IGameConfig {
    targetScore:      number;
    maxMoves:         number;
    shuffleMaxCount:  number;
    scorePerTile:     number;
    scoreGroupBonus:  number;
}

export const GameConfig: IGameConfig = {
    targetScore:     2500,
    maxMoves:        30,
    shuffleMaxCount: 3,
    scorePerTile:    10,
    scoreGroupBonus: 5,
};
