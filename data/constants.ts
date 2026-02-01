export const BASE_FOV = 60;
export const BASE_SMOOTH_FACTOR = 0.15;
export const BASE_AUDIO_INTERVAL = 250;

export enum Scenes {
  ASFAY         = 'asfay',
  ASSIOMA       = 'assioma',
  CONFINE       = 'confine',
  DATASET       = 'dataset',
  ESGIBTBROT    = 'esgibtbrot',
  FAKE_OUT      = 'fake-out',
  FUNCTIII      = 'functiii',
  GHOSTSSS      = 'ghostsss',
  LIKE_NOTHING  = 'like-nothing',
  MITTERGRIES   = 'mittergries',
  MTGO          = 'mtgo',
  PSSST         = 'pssst',
  RFBONGOS      = 'rfbongos',
  SISTEMA       = 'sistema',
  SOLO_01       = 'solo-01',
  SOLO_02       = 'solo-02',
  SOLO_03       = 'solo-03',
  SOLO_04       = 'solo-04',
  STAYS_NOWHERE = 'stays-nowhere',
  SUPER_JUST    = 'super-just',
  TUFTEEE       = 'tufteee',
  USBTEC        = 'usbtec',
  ZENO          = 'zeno',
  ZOHO          = 'zoho',
  STOP          = 'STOP',
}

export enum ChannelNames {
  PB_CH_1_DRUMS     = 1,
  PB_CH_2_BASS      = 2,
  PB_CH_3_HARMONIES = 3,
  PB_CH_4_TEXTURE   = 4,
  BRASS             = 5,
  WOODWINDS         = 6,
  BD                = 7,
  SN                = 8,
  OH                = 9,
  DRUMS_MIDI        = 10,
  BASS              = 11,
  KEYS              = 12,
  KEYS_MIDI         = 13,
  LIVE_FX           = 14,
  MASTER_CTRL       = 15,
}

export enum InstrumentParams {
  PITCH        = 'pitch',
  LOUDNESS     = 'loudness',
  CENTROID     = 'centroid',
  FLATNESS     = 'flatness',
  ONOFF        = 'onOff',
  MIDI         = 'midi',
}

export enum MasterParams {
  TEMPO        = 'tempo',
  ELAPSED_TIME = 'elapsedTime',
  BEAT         = 'beat',
  SCENE        = 'scene',
}

export const ChannelParams = { ...InstrumentParams, ...MasterParams };

export enum Acts {
  ONE    = 1,
  TWO    = 2,
  THREE  = 3,
}

export enum ShapeType {
  RECTANGLE = 'rectangle',
  CIRCLE    = 'circle',
  LINE      = 'line',
}

export enum LayoutType {
  GRID          = 'grid',
  SPHERE        = 'sphere',
  CYLINDER      = 'cylinder',
  SPIRAL        = 'spiral',
  FLOCK         = 'flock',
  SPHERE_MATRIX = 'sphere-matrix',
}

export enum Shape2DType {
  RECTANGLE = 'rectangle',
  TEXT      = 'text',
  LINE      = 'line',
  CROSS     = 'cross',
}

export enum Layout2DType {
  GRID    = 'grid',
  SCAN    = 'scan',
  TRACK   = 'track',
  MATRIX  = 'matrix',
}

export enum TextAligns {
  LEFT   = 'left',
  CENTER = 'center',
  RIGHT  = 'right',
}

export enum VerticalAligns {
  TOP     = 'top',
  MIDDLE  = 'middle',
  BOTTOM  = 'bottom',
}

export enum OriginModes {
  CENTER = 'center',
  CORNER = 'corner',
}

export enum Palette {
  DARK  = '#000000',
  WHITE = '#FFFFFF',
  LIGHT = '#EEEEEE',
  RED   = '#FF0000',
  GREEN = '#00FF00',
}

export enum Fonts {
  SERIF = 'Instrument Serif',
  MONO  = 'Space Grotesk',
}

export const BASE_BACKGROUND = Palette.LIGHT;

export const SEQUENCES = {
  prime:      [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 27, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107],
  square:     [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400],
  triangular: [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78, 91, 105, 120, 136, 153, 171, 190, 210],
  fibonacci:  [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181],
  lucas:      [2, 1, 3, 4, 7, 11, 18, 29, 47, 123, 199, 322, 521, 843, 1364, 2207, 3571, 5778, 9349, 15127],
  catalan:    [1, 1, 2, 5, 14, 42, 132, 429, 1430, 48862, 16796],
  factorial:  [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800],
}

export const DEBUG_SCENE = Scenes.RFBONGOS as Scenes;
