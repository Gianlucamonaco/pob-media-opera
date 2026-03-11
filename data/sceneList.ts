import { Scenes, Acts } from "./constants";
import type { SceneMeta } from "./types";

export const scenesActOne: SceneMeta[] = [
  Scenes.SISTEMA,
  Scenes.SOLO_01,
  Scenes.MITTERGRIES,
  Scenes.GHOSTSSS,
  Scenes.ESGIBTBROT,
  Scenes.SUPER_JUST,
  Scenes.RFBONGOS,
  Scenes.SOLO_02,
].map((title, index) => ({ title, act: Acts.ONE, trackIndex: index }))

export const scenesActTwo: SceneMeta[] = [
  Scenes.DATASET,
  Scenes.ZOHO,
  Scenes.CONFINE,
  Scenes.FAKE_OUT,
  Scenes.MTGO,
  Scenes.ASFAY,
  Scenes.STAYS_NOWHERE,
  Scenes.SOLO_03,
].map((title, index) => ({ title, act: Acts.TWO, trackIndex: scenesActOne.length + index }))

export const scenesActThree: SceneMeta[] = [
  Scenes.ZENO,
  Scenes.USBTEC,
  Scenes.ASSIOMA,
  Scenes.TUFTEEE,
  Scenes.FUNCTIII,
  Scenes.LIKE_NOTHING,
  Scenes.SOLO_04,
  Scenes.STRANGE_ATTRACTOR,
].map((title, index) => ({ title, act: Acts.THREE, trackIndex: scenesActOne.length + scenesActTwo.length + index }))

export const sceneList = [
  ...scenesActOne,
  ...scenesActTwo,
  ...scenesActThree,
];