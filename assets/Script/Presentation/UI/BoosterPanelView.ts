import { eventBus } from '../../Core/Events/EventBus';

const { ccclass, property } = cc._decorator;

/** Панель бустеров. Сам подписывается на события и передаёт команды через eventBus. */
@ccclass
export class BoosterPanelView extends cc.Component {

    @property(cc.Button)
    boosterBombBtn: cc.Button = null;

    @property(cc.Label)
    boosterBombCountLabel: cc.Label = null;

    @property(cc.Button)
    boosterTeleportBtn: cc.Button = null;

    @property(cc.Label)
    boosterTeleportCountLabel: cc.Label = null;

    private bombCount:     number = 3;
    private teleportCount: number = 5;

    onLoad(): void {
        eventBus.on('game:win',     () => this.setInteractable(false));
        eventBus.on('game:lose',    () => this.setInteractable(false));
        eventBus.on('game:restart', () => this.onRestart());

        if (this.boosterBombBtn) {
            this.boosterBombBtn.node.on('click', this.onBombClick, this);
        }

        if (this.boosterTeleportBtn) {
            this.boosterTeleportBtn.node.on('click', this.onTeleportClick, this);
        }

        this.refreshLabels();
    }

    onDestroy(): void {
        if (this.boosterBombBtn) {
            this.boosterBombBtn.node.off('click', this.onBombClick, this);
        }
        if (this.boosterTeleportBtn) {
            this.boosterTeleportBtn.node.off('click', this.onTeleportClick, this);
        }
    }

    private onBombClick(): void {
        if (this.bombCount <= 0) return;
        this.bombCount--;
        this.refreshLabels();
        eventBus.emit('booster:activated', { boosterType: 'bomb' });
    }

    private onTeleportClick(): void {
        if (this.teleportCount <= 0) return;
        this.teleportCount--;
        this.refreshLabels();
        eventBus.emit('booster:activated', { boosterType: 'teleport' });
    }

    private refreshLabels(): void {
        if (this.boosterBombCountLabel)     this.boosterBombCountLabel.string     = `${this.bombCount}`;
        if (this.boosterTeleportCountLabel) this.boosterTeleportCountLabel.string = `${this.teleportCount}`;

        if (this.boosterBombBtn)     this.boosterBombBtn.interactable     = this.bombCount > 0;
        if (this.boosterTeleportBtn) this.boosterTeleportBtn.interactable = this.teleportCount > 0;
    }

    private setInteractable(value: boolean): void {
        if (this.boosterBombBtn)     this.boosterBombBtn.interactable     = value && this.bombCount > 0;
        if (this.boosterTeleportBtn) this.boosterTeleportBtn.interactable = value && this.teleportCount > 0;
    }

    private onRestart(): void {
        this.bombCount     = 3;
        this.teleportCount = 5;
        this.refreshLabels();
        this.setInteractable(true);
    }
}
