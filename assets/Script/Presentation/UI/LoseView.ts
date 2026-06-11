import { eventBus } from '../../Core/Events/EventBus';

const { ccclass, property } = cc._decorator;

/** Экран поражения. Показывается при исчерпании ходов или отсутствии возможных ходов. */
@ccclass
export class LoseView extends cc.Component {

    @property(cc.Label)
    reasonLabel: cc.Label = null;

    @property(cc.Button)
    restartBtn: cc.Button = null;

    private readonly reasonText: { [key: string]: string } = {
        'no_moves':    'Ходы закончились',
        'no_groups':   'Нет доступных групп',
        'no_shuffles': 'Перемешивания закончились',
    };

    onLoad(): void {
        this.node.active = false;

        eventBus.on('game:lose', ({ reason }) => {
            this.node.active = true;
            if (this.reasonLabel) {
                this.reasonLabel.string = this.reasonText[reason] || reason;
            }
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
