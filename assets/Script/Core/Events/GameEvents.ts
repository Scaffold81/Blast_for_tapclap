import { TileModel } from '../../Domain/Models/TileModel';
import { FallChange } from '../../Domain/Logic/FallLogic';

export interface BlastCompleteEvent {
    tiles: TileModel[];
    clickedTile: TileModel;
}

export interface ScoreChangedEvent {
    score: number;
    delta: number;
}

export interface MovesChangedEvent {
    movesLeft: number;
}

export interface FallCompleteEvent {
    changes: FallChange[];
}

export interface FillCompleteEvent {
    tiles: TileModel[];
}

export interface ShuffleCompleteEvent {
    shufflesLeft: number;
}

export interface SuperTileSpawnedEvent {
    tile: TileModel;
}

export interface SuperTileActivatedEvent {
    tile: TileModel;
    affectedTiles: TileModel[];
}

export interface BoosterActivatedEvent {
    boosterType: string;
}

export interface BoosterAimingEvent {
    boosterType: string;
}

export interface BoosterCancelledEvent {}

export interface BoosterCompleteEvent {
    boosterType: string;
}

export interface TilesSwappedEvent {
    tileA: TileModel;
    tileB: TileModel;
}

export interface GameWinEvent {
    score: number;
    movesLeft: number;
}

export interface GameLoseEvent {
    reason: 'no_moves' | 'no_groups' | 'no_shuffles';
}

/** Маппинг всех игровых событий на их payload-типы. */
export interface GameEventMap {
    'blast:complete':        BlastCompleteEvent;
    'score:changed':         ScoreChangedEvent;
    'moves:changed':         MovesChangedEvent;
    'fall:complete':         FallCompleteEvent;
    'fill:complete':         FillCompleteEvent;
    'shuffle:complete':      ShuffleCompleteEvent;
    'supertile:spawned':     SuperTileSpawnedEvent;
    'supertile:activated':   SuperTileActivatedEvent;
    'booster:activated':     BoosterActivatedEvent;
    'booster:aiming':        BoosterAimingEvent;
    'booster:cancelled':     BoosterCancelledEvent;
    'booster:complete':      BoosterCompleteEvent;
    'tiles:swapped':         TilesSwappedEvent;
    'game:win':              GameWinEvent;
    'game:lose':             GameLoseEvent;
    'game:restart':          void;
}

export type GameEventKey = keyof GameEventMap;
