import { Scenes, Acts } from "./constants";
import type { SceneMeta } from "./types";

export const scenesActOne: SceneMeta[] = [
  Scenes.INTRO_01,
  Scenes.INTRO_02,
  Scenes.MITTERGRIES,
  Scenes.GHOSTSSS,
  Scenes.ESGIBTBROT,
  Scenes.SUPERJUST,
  Scenes.RFBONGOS
].map((title, index) => ({ title, act: Acts.ONE, trackIndex: index }))

export const scenesActTwo: SceneMeta[] = [
  Scenes.DATASET,
  Scenes.MTGO,
  Scenes.ASFAY,
  Scenes.CONFINE,
  Scenes.FAKEOUT,
  Scenes.ZOHO,
  Scenes.STAYSNOWHERE,
].map((title, index) => ({ title, act: Acts.TWO, trackIndex: scenesActOne.length + index }))

export const scenesActThree: SceneMeta[] = [
  Scenes.LIKENOTHING,
  Scenes.PSSST,
  Scenes.FUNCTII,
  Scenes.TUFTEEE,
  Scenes.ASSIOMA,
  Scenes.USBTEC,
  Scenes.ZENO,
].map((title, index) => ({ title, act: Acts.THREE, trackIndex: scenesActOne.length + scenesActTwo.length + index }))

export const sceneList = [
  ...scenesActOne,
  ...scenesActTwo,
  ...scenesActThree,
];

console.log(scenesActOne)