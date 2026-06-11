import { TileView } from '../Views/TileView';

/** Централизованные анимации игры. Promise-based API — FSM ждёт окончания анимации перед переходом. */
export class AnimationService {

    playBlast(views: TileView[]): Promise<void> {
        const promises = views.map(v => v.playBlast());
        return Promise.all(promises).then(() => {});
    }

    playFall(views: TileView[], toYMap: Map<TileView, number>): Promise<void> {
        const promises: Promise<void>[] = [];

        views.forEach(view => {
            const toY = toYMap.get(view);
            if (toY !== undefined) {
                promises.push(view.playFall(toY));
            }
        });

        return Promise.all(promises).then(() => {});
    }

    playSpawn(views: TileView[]): Promise<void> {
        const promises = views.map(v => v.playSpawn());
        return Promise.all(promises).then(() => {});
    }

    playSuperTile(view: TileView): Promise<void> {
        return new Promise(resolve => {
            cc.tween(view.node)
                .to(0.1, { scale: 1.3 })
                .to(0.1, { scale: 1.0 })
                .call(() => resolve())
                .start();
        });
    }
}
