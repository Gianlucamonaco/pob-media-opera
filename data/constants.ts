export const BASE_FOV = 60;
export const BASE_SMOOTH_FACTOR = 0.15;
export const BASE_AUDIO_INTERVAL = 250;
export const BASE_BACKGROUND = 0xeeeeee

export enum Scenes {
  ASFAY         = 'asfay',
  ASSIOMA       = 'assioma',
  CONFINE       = 'confine',
  DATASET       = 'dataset',
  ESGIBTBROT    = 'esgibtbrot',
  FAKE_OUT      = 'fake-out',
  FUNCTIII      = 'functiii',
  GHOSTSSS      = 'ghostsss',
  INTRO_01      = 'intro-01',
  INTRO_02      = 'intro-02',
  LIKE_NOTHING  = 'like-nothing',
  MITTERGRIES   = 'mittergries',
  MTGO          = 'mtgo',
  PSSST         = 'pssst',
  RFBONGOS      = 'rfbongos',
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
  GRID    = 'grid',
  SPHERE  = 'sphere',
  SPIRAL  = 'spiral',
  FLOCK   = 'flock',
}

export enum Shape2DType {
  RECTANGLE = 'rectangle',
  TEXT      = 'text',
  LINE      = 'line',
}

export enum Layout2DType {
  GRID    = 'grid',
  SCAN    = 'scan',
  TRACK   = 'track',
}

export const DEBUG_SCENE = Scenes.RFBONGOS as Scenes;
