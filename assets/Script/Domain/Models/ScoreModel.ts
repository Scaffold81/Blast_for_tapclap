/** Счёт текущей игры: очки, оставшиеся ходы, условия победы и поражения. */
export class ScoreModel {
    private _score:       number;
    private _movesLeft:   number;
    private _targetScore: number;

    constructor(targetScore: number, maxMoves: number) {
        this._score       = 0;
        this._movesLeft   = maxMoves;
        this._targetScore = targetScore;
    }

    get score():       number { return this._score;       }
    get movesLeft():   number { return this._movesLeft;   }
    get targetScore(): number { return this._targetScore; }

    get isWin():  boolean { return this._score >= this._targetScore; }
    get isLose(): boolean { return this._movesLeft <= 0 && !this.isWin; }

    addScore(delta: number): void {
        this._score += delta;
    }

    spendMove(): void {
        if (this._movesLeft > 0) this._movesLeft--;
    }

    reset(targetScore: number, maxMoves: number): void {
        this._score       = 0;
        this._movesLeft   = maxMoves;
        this._targetScore = targetScore;
    }
}
