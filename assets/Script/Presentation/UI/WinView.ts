import { eventBus } from '../../Core/Events/EventBus';

const { ccclass, property } = cc._decorator;

/** Экран победы. Показывается при достижении целевого счёта. */
@ccclass
export class WinView extends cc.Component {

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    movesLeftLabel: cc.Label = null;

    @property(cc.Button)
    restartBtn: cc.Button = null;

    onLoad(): void {
        this.node.active = false;

        eventBus.on('game:win', ({ score, movesLeft }) => {
            this.node.active = true;
            if (this.scoreLabel)     this.scoreLabel.string     = `${score}`;
            if (this.movesLeftLabel) this.movesLeftLabel.string = `${movesLeft}`;
        });

        eventBus.on('game:restart', () => {
            this.node.active = false;
        });

        if (this.restartBtn) {
            this.restartBtn.node.on('click', () => {
                eventBus.emit('game:restart');
            });
        }
    }
}
