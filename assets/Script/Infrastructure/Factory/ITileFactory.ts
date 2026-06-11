import { TileModel } from '../../Domain/Models/TileModel';
import { TileType, SuperTileType } from '../../Domain/Models/TileType';

/** Контракт фабрики тайлов. Скрывает создание модели и ноды от вызывающего кода. */
export interface ITileFactory {
    createModel(row: number, col: number, type: TileType, superType?: SuperTileType): TileModel;
    createView(model: TileModel, parent: cc.Node): cc.Node;
    releaseView(node: cc.Node): void;
}
