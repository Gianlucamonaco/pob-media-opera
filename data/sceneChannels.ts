import { ChannelNames, Scenes } from "./constants";

export const sceneChannels: Partial<Record<Scenes, number[]>> = {
  [Scenes.ASFAY]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.BASS, ChannelNames.KEYS],

  [Scenes.ASSIOMA]: [],

  [Scenes.CONFINE]: [ChannelNames.BASS, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.KEYS],

  [Scenes.DATASET]: [ChannelNames.PB_CH_4_TEXTURE, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.KEYS, ChannelNames.KEYS_CLEM],

  [Scenes.ESGIBTBROT]: [ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.BD, ChannelNames.BASS, ChannelNames.KEYS, ChannelNames.KEYS_CLEM],

  [Scenes.FAKE_OUT]: [ChannelNames.KEYS, ChannelNames.BRASS, ChannelNames.WOODWINDS],

  [Scenes.FUNCTIII]: [],

  [Scenes.GHOSTSSS]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.PB_CH_3_HARMONIES, ChannelNames.PB_CH_4_TEXTURE, ChannelNames.SN, ChannelNames.BASS, ChannelNames.KEYS],

  [Scenes.LIKE_NOTHING]: [],

  [Scenes.MITTERGRIES]: [ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.BASS, ChannelNames.KEYS, ChannelNames.KEYS_CLEM],

  [Scenes.MTGO]: [ChannelNames.WOODWINDS, ChannelNames.BRASS, ChannelNames.BASS, ChannelNames.KEYS],

  [Scenes.RFBONGOS]: [ChannelNames.OH, ChannelNames.LIVE_FX],

  [Scenes.SISTEMA]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.PB_CH_3_HARMONIES, ChannelNames.PB_CH_4_TEXTURE, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.OH],

  [Scenes.SOLO_01]: [ChannelNames.PB_CH_4_TEXTURE, ChannelNames.BRASS],

  [Scenes.SOLO_02]: [ChannelNames.BRASS],

  [Scenes.SOLO_03]: [ChannelNames.WOODWINDS],

  [Scenes.SOLO_04]: [ChannelNames.KEYS_MIDI],

  [Scenes.STAYS_NOWHERE]: [ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.KEYS, ChannelNames.BASS, ChannelNames.LIVE_FX],

  [Scenes.STRANGE_ATTRACTOR]: [],

  [Scenes.SUPER_JUST]: [ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.BASS, ChannelNames.KEYS, ChannelNames.KEYS_CLEM],

  [Scenes.TUFTEEE]: [],

  [Scenes.USBTEC]: [],

  [Scenes.ZENO]: [],

  [Scenes.ZOHO]: [ChannelNames.BRASS, ChannelNames.KEYS],

}