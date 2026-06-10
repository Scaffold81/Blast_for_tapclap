
// Все токены в одном месте. Потерял — ищи здесь.
// Не супер решение но для Cocos на вскидку ничего не нашел и не придумал. 
// В идеале хотелось бы юзать классы, но тогда нужно юзать @injectable и @inject везде, 
// а это уже перебор для такого проекта.Поэтому юзаем символы и юзаем их везде, где нужно.Если потерял токен — ищи здесь.
//Опять IDE за меня умничает.

export const TYPES = {
    // Config
    GameConfig:          Symbol.for('GameConfig'),
    BoardConfig:         Symbol.for('BoardConfig'),
    BoosterConfig:       Symbol.for('BoosterConfig'),
    TileSpriteConfig:    Symbol.for('TileSpriteConfig'),

    // Core
    EventBus:            Symbol.for('EventBus'),
    StateMachine:        Symbol.for('StateMachine'),

    // Infrastructure
    SaveService:         Symbol.for('SaveService'),
    PoolService:         Symbol.for('PoolService'),
    SpriteConfigService: Symbol.for('SpriteConfigService'),
    TileFactory:         Symbol.for('TileFactory'),
    BoardGenerator:      Symbol.for('BoardGenerator'),

    // Domain
    BlastLogic:          Symbol.for('BlastLogic'),
    FallLogic:           Symbol.for('FallLogic'),
    ShuffleLogic:        Symbol.for('ShuffleLogic'),

    // Application
    GameController:      Symbol.for('GameController'),
} as const;

export type TypeKey = typeof TYPES[keyof typeof TYPES];
