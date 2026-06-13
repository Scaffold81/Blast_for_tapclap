import { ICommand }          from './ICommand';
import { BoardModel }        from '../../Domain/Models/BoardModel';
import { ScoreModel }        from '../../Domain/Models/ScoreModel';
import { TileModel }         from '../../Domain/Models/TileModel';
import { IGameConfig }       from '../../Config/GameConfig';
import { SuperTileRegistry } from '../SuperTiles/SuperTileRegistry';
import { eventBus }          from '../../Core/Events/EventBus';

/** Активирует супер-тайл через реестр эффектов. Поддерживает цепочку активаций. */
export class SuperTileCommand implements ICommand {

    constructor(
        private board:    BoardModel,
        private score:    ScoreModel,
        private config:   IGameConfig,
        private registry: SuperTileRegistry,
        private row:      number,
        private col:      number,
    ) {}

    execute(): void {
        const tile = this.board.getTile(this.row, this.col);
        if (!tile || !tile.isSuper) return;

        const effect = this.registry.get(tile.superType);
        if (!effect) {
            cc.warn(`[SuperTileCommand] Неизвестный тип супертайла: ${tile.superType}`);
            return;
        }

        const affected = effect.collect(this.board, this.row, this.col);
        if (affected.length === 0) return;

        // Сохраняем цепочку супертайлов ДО очистки
        const chain = affected
            .filter(t => t.isSuper && !(t.row === this.row && t.col === this.col))
            .map(t => ({ row: t.row, col: t.col, type: t.type, superType: t.superType }));

        // Создаём фиктивный clickedTile без isSuper — чтобы BoardView его удалил
        const clickedSnapshot = {
            row:       tile.row,
            col:       tile.col,
            type:      tile.type,
            superType: tile.superType,
            isSuper:   false,
            isEmpty:   false,
        } as any;

        const scoreGain = affected.length * this.config.scorePerTile;
        affected.forEach(t => t.setEmpty());
        this.score.addScore(scoreGain);

        eventBus.emit('blast:complete',      { tiles: affected, clickedTile: clickedSnapshot });
        eventBus.emit('supertile:activated', { tile: clickedSnapshot, affectedTiles: affected });
        eventBus.emit('score:changed',       { score: this.score.score, delta: scoreGain });

        // Активируем цепочку
        chain.forEach(saved => {
            const chainTile = this.board.getTile(saved.row, saved.col);
            if (!chainTile) return;
            chainTile.type      = saved.type;
            chainTile.superType = saved.superType;
            new SuperTileCommand(this.board, this.score, this.config, this.registry, saved.row, saved.col).execute();
        });
    }
}
