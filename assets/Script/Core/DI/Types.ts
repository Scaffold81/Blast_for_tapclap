/** Токены для DI-контейнера. Каждый сервис регистрируется и запрашивается по своему токену. */
export const TYPES = {
    GameConfig:          Symbol.for('GameConfig'),
    BoardConfig:         Symbol.for('BoardConfig'),
    BoosterConfig:       Symbol.for('BoosterConfig'),
    TileSpriteConfig:    Symbol.for('TileSpriteConfig'),

    EventBus:            Symbol.for('EventBus'),
    StateMachine:        Symbol.for('StateMachine'),

    SaveService:         Symbol.for('SaveService'),
    PoolService:         Symbol.for('PoolService'),
    SpriteConfigService: Symbol.for('SpriteConfigService'),
    TileFactory:         Symbol.for('TileFactory'),
    BoardGenerator:      Symbol.for('BoardGenerator'),

    BlastLogic:          Symbol.for('BlastLogic'),
    FallLogic:           Symbol.for('FallLogic'),
    ShuffleLogic:        Symbol.for('ShuffleLogic'),

    GameController:      Symbol.for('GameController'),
} as const;

export type TypeKey = typeof TYPES[keyof typeof TYPES];
