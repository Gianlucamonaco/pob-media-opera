export enum Scenes {
  INTRO_01  = 'Intro 01',
  INTRO_02  = 'Intro 02',

  MITTERGRIES  = 'Mittergries',
  GHOSTSSS     = 'Ghostsss',
  ESGIBTBROT   = 'Esgibtbrot',
  RFBONGOS     = 'RFBongos',
  SUPERJUST    = 'Super Just',

  DATASET      = 'Dataset',
  MTGO         = 'MtGo',
  ASFAY        = 'Asfay',
  CONFINE      = 'Confine',
  FAKEOUT      = 'Fake out',
  ZOHO         = 'Zoho',
  STAYSNOWHERE = 'Stays nowhere',

  LIKENOTHING  = 'Like nothing',
  PSSST        = 'Pssst',
  FUNCTII      = 'Functiii',
  TUFTEEE      = 'Tufteee',
  ASSIOMA      = 'Assioma',
  USBTEC       = 'USBTec',
  ZENO         = 'Zeno',
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