import { eventBus } from '../../Core/Events/EventBus';
import { GameConfig } from '../../Config/GameConfig';

const { ccclass, property } = cc._decorator;

/** Отображает текущий счёт и ходы. Сам подписывается на события. */
@ccclass
export class ScoreView extends cc.Component {

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    movesLabel: cc.Label = null;

    private targetScore: number = 0;
    private currentScore: number = 0;
    private currentMoves: number = 0;

    onLoad(): void {
        this.targetScore  = GameConfig.targetScore;
        this.currentMoves = GameConfig.maxMoves;

        eventBus.on('score:changed', ({ score }) => this.setScore(score));
        eventBus.on('moves:changed', ({ movesLeft }) => this.setMoves(movesLeft));
        eventBus.on('game:restart',  () => this.onRestart());
    }

    start(): void {
        this.setScore(this.currentScore);
        this.setMoves(this.currentMoves);
    }

    onDestroy(): void {
        eventBus.offAll(this.setScore.bind(this));
        eventBus.offAll(this.setMoves.bind(this));
    }

    private setScore(score: number): void {
        this.currentScore = score;
        if (this.scoreLabel) this.scoreLabel.string = `${score}/${this.targetScore}`;
    }

    private setMoves(movesLeft: number): void {
        this.currentMoves = movesLeft;
        if (this.movesLabel) this.movesLabel.string = `${movesLeft}`;
    }

    private onRestart(): void {
        this.currentScore = 0;
        this.currentMoves = GameConfig.maxMoves;
        this.setScore(this.currentScore);
        this.setMoves(this.currentMoves);
    }
}
