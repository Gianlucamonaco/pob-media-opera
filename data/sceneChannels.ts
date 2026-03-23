import { ChannelNames, Scenes } from "./constants";

export const sceneChannels: Partial<Record<Scenes, number[]>> = {
  [Scenes.ASFAY]: [ChannelNames.PB_CH_3_HARMONIES, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.BASS, ChannelNames.KEYS],

  [Scenes.ASSIOMA]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.PB_CH_4_TEXTURE, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.SN, ChannelNames.KEYS],

  [Scenes.CONFINE]: [ChannelNames.BASS, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.KEYS],

  [Scenes.DATASET]: [ChannelNames.PB_CH_4_TEXTURE, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.KEYS, ChannelNames.KEYS_CLEM],

  [Scenes.ESGIBTBROT]: [ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.BD, ChannelNames.BASS, ChannelNames.KEYS, ChannelNames.KEYS_CLEM],

  [Scenes.FAKE_OUT]: [ChannelNames.KEYS, ChannelNames.BRASS, ChannelNames.WOODWINDS],

  [Scenes.FUNCTIII]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.PB_CH_3_HARMONIES, ChannelNames.PB_CH_4_TEXTURE, ChannelNames.BD, ChannelNames.SN, ChannelNames.BASS, ChannelNames.KEYS],

  [Scenes.GHOSTSSS]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.PB_CH_3_HARMONIES, ChannelNames.PB_CH_4_TEXTURE, ChannelNames.SN, ChannelNames.BASS, ChannelNames.KEYS],

  [Scenes.LIKE_NOTHING]: [ChannelNames.BASS, ChannelNames.BD, ChannelNames.OH, ChannelNames.WOODWINDS, ChannelNames.BRASS, ChannelNames.KEYS],

  [Scenes.MITTERGRIES]: [ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.BASS, ChannelNames.KEYS, ChannelNames.KEYS_CLEM],

  [Scenes.MTGO]: [ChannelNames.WOODWINDS, ChannelNames.BRASS, ChannelNames.BASS, ChannelNames.KEYS],

  [Scenes.RFBONGOS]: [ChannelNames.OH, ChannelNames.LIVE_FX],

  [Scenes.SISTEMA]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.PB_CH_3_HARMONIES, ChannelNames.PB_CH_4_TEXTURE, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.OH],

  [Scenes.SOLO_01]: [ChannelNames.PB_CH_4_TEXTURE, ChannelNames.BRASS],

  [Scenes.SOLO_02]: [ChannelNames.BRASS],

  [Scenes.SOLO_03]: [ChannelNames.WOODWINDS],

  [Scenes.SOLO_04]: [ChannelNames.KEYS_MIDI],

  [Scenes.STAYS_NOWHERE]: [ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.KEYS, ChannelNames.BASS, ChannelNames.LIVE_FX],

  [Scenes.STRANGE_ATTRACTOR]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.PB_CH_2_BASS, ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.BD, ChannelNames.BASS, ChannelNames.KEYS],

  [Scenes.SUPER_JUST]: [ChannelNames.BRASS, ChannelNames.WOODWINDS, ChannelNames.BASS, ChannelNames.KEYS, ChannelNames.KEYS_CLEM],

  [Scenes.TUFTEEE]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.WOODWINDS, ChannelNames.BRASS, ChannelNames.BASS, ChannelNames.KEYS, ChannelNames.OH],

  [Scenes.USBTEC]: [ChannelNames.WOODWINDS, ChannelNames.BRASS, ChannelNames.BD, ChannelNames.OH, ChannelNames.BASS, ChannelNames.LIVE_FX],

  [Scenes.ZENO]: [ChannelNames.PB_CH_1_DRUMS, ChannelNames.PB_CH_3_HARMONIES, ChannelNames.OH, ChannelNames.SN, ChannelNames.BD, ChannelNames.BRASS, ChannelNames.WOODWINDS],

  [Scenes.ZOHO]: [ChannelNames.BRASS, ChannelNames.KEYS],

}