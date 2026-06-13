import { eventBus } from '../../Core/Events/EventBus';

const { ccclass, property } = cc._decorator;

/** Панель бустеров. При нажатии входит в режим прицеливания, кнопка увеличивается. */
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
    private activeBooster: string = '';

    onLoad(): void {
        eventBus.on('game:win',          () => this.setInteractable(false));
        eventBus.on('game:lose',         () => this.setInteractable(false));
        eventBus.on('game:restart',      () => this.onRestart());
        eventBus.on('booster:cancelled', () => this.resetButtons());
        eventBus.on('booster:complete',  ({ boosterType }) => this.onBoosterComplete(boosterType));

        if (this.boosterBombBtn) {
            this.boosterBombBtn.node.on('click', this.onBombClick, this);
        }
        if (this.boosterTeleportBtn) {
            this.boosterTeleportBtn.node.on('click', this.onTeleportClick, this);
        }

        this.refreshLabels();
    }

    onDestroy(): void {
        if (this.boosterBombBtn)     this.boosterBombBtn.node.off('click', this.onBombClick, this);
        if (this.boosterTeleportBtn) this.boosterTeleportBtn.node.off('click', this.onTeleportClick, this);
    }

    private onBombClick(): void {
        if (this.activeBooster === 'bomb') {
            this.cancelAiming();
            return;
        }
        if (this.bombCount <= 0) return;
        this.startAiming('bomb');
    }

    private onTeleportClick(): void {
        if (this.activeBooster === 'teleport') {
            this.cancelAiming();
            return;
        }
        if (this.teleportCount <= 0) return;
        this.startAiming('teleport');
    }

    private startAiming(boosterType: string): void {
        this.activeBooster = boosterType;
        this.setButtonScale(boosterType, 1.2);
        eventBus.emit('booster:aiming', { boosterType });
    }

    private cancelAiming(): void {
        eventBus.emit('booster:cancelled', {});
        this.resetButtons();
    }

    private onBoosterComplete(boosterType: string): void {
        if (boosterType === 'bomb') {
            this.bombCount = Math.max(0, this.bombCount - 1);
        } else if (boosterType === 'teleport') {
            this.teleportCount = Math.max(0, this.teleportCount - 1);
        }
        this.resetButtons();
        this.refreshLabels();
    }

    private resetButtons(): void {
        this.activeBooster = '';
        this.setButtonScale('bomb',     1.0);
        this.setButtonScale('teleport', 1.0);
    }

    private setButtonScale(boosterType: string, scale: number): void {
        let node: cc.Node = null;
        if (boosterType === 'bomb' && this.boosterBombBtn) {
            node = this.boosterBombBtn.node;
        } else if (boosterType === 'teleport' && this.boosterTeleportBtn) {
            node = this.boosterTeleportBtn.node;
        }
        if (!node) return;
        cc.Tween.stopAllByTarget(node);
        cc.tween(node).to(0.15, { scale }).start();
    }

    private refreshLabels(): void {
        if (this.boosterBombCountLabel)     this.boosterBombCountLabel.string     = `${this.bombCount}`;
        if (this.boosterTeleportCountLabel) this.boosterTeleportCountLabel.string = `${this.teleportCount}`;
        if (this.boosterBombBtn)            this.boosterBombBtn.interactable      = this.bombCount > 0;
        if (this.boosterTeleportBtn)        this.boosterTeleportBtn.interactable  = this.teleportCount > 0;
    }

    private setInteractable(value: boolean): void {
        if (this.boosterBombBtn)     this.boosterBombBtn.interactable     = value && this.bombCount > 0;
        if (this.boosterTeleportBtn) this.boosterTeleportBtn.interactable = value && this.teleportCount > 0;
    }

    private onRestart(): void {
        this.bombCount     = 3;
        this.teleportCount = 5;
        this.resetButtons();
        this.refreshLabels();
        this.setInteractable(true);
    }
}
