export enum Scenes {
  ASFAY         = 'asfay',
  ASSIOMA       = 'assioma',
  CONFINE       = 'confine',
  DATASET       = 'dataset',
  ESGIBTBROT    = 'esgibtbrot',
  FAKE_OUT      = 'fake-out',
  FUNCTII       = 'functiii',
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