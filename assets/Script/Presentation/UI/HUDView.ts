import { eventBus } from '../../Core/Events/EventBus';

const { ccclass, property } = cc._decorator;

/** HUD: отображает очки, оставшиеся ходы и кнопки бустеров. */
@ccclass
export class HUDView extends cc.Component {

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    movesLabel: cc.Label = null;

    @property(cc.Label)
    targetScoreLabel: cc.Label = null;

    @property(cc.Button)
    boosterBombBtn: cc.Button = null;

    @property(cc.Button)
    boosterTeleportBtn: cc.Button = null;

    onLoad(): void {
        eventBus.on('score:changed', ({ score }) => this.setScore(score));
        eventBus.on('moves:changed', ({ movesLeft }) => this.setMoves(movesLeft));
        eventBus.on('game:restart',  () => this.setInteractable(true));
        eventBus.on('game:win',      () => this.setInteractable(false));
        eventBus.on('game:lose',     () => this.setInteractable(false));
    }

    onDestroy(): void {
        eventBus.offAll(this.setScore.bind(this));
        eventBus.offAll(this.setMoves.bind(this));
    }

    refresh(score: number, movesLeft: number, targetScore: number): void {
        this.setScore(score);
        this.setMoves(movesLeft);
        if (this.targetScoreLabel) this.targetScoreLabel.string = `${targetScore}`;
    }

    private setScore(score: number): void {
        if (this.scoreLabel) this.scoreLabel.string = `${score}`;
    }

    private setMoves(movesLeft: number): void {
        if (this.movesLabel) this.movesLabel.string = `${movesLeft}`;
    }

    private setInteractable(value: boolean): void {
        if (this.boosterBombBtn)     this.boosterBombBtn.interactable     = value;
        if (this.boosterTeleportBtn) this.boosterTeleportBtn.interactable = value;
    }
}
