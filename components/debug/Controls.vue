<script setup lang="ts">
import { midiState } from '~/composables/controls/MIDI';
import { Scenes } from '~/data/constants';
import { KnobTypes, PadTypes } from '~/data/types';

const controller = midiState;
const currentScene = useSceneMeta();

const keyboardBindings = [
  { key: '0', text: 'First scene' },
  { key: '1', text: 'Solo 1' },
  { key: '2', text: 'Solo 2' },
  { key: '3', text: 'Solo 3' },
  { key: '4', text: 'Solo 4' },
  { key: '9', text: 'Last scene' },
  { key: '-', text: 'Clear scene' },
  { key: '/', text: 'Clear audio' },
  { key: 'E', text: 'End scene' },
  { key: 'D', text: 'Toggle UI' },
  { key: 'R', text: 'Rotate 90' },
  { key: 'S', text: 'Export PNG' },
]

const sceneBindings: Partial<Record<Scenes, (
  { key: PadTypes, text: string } | { key: KnobTypes, text: string }
)[]>> = {
  [Scenes.ASFAY]: [
    { key: KnobTypes.K1, text: 'Visibility chance' },
    { key: KnobTypes.K2, text: 'Rotation factor 1' },
    { key: KnobTypes.K3, text: 'Rotation factor 2' },
    { key: KnobTypes.K4, text: 'Rotation factor 3' },
    { key: KnobTypes.K5, text: 'Text visibility chance' },
    { key: KnobTypes.K6, text: 'Text visibility factor' },
    { key: PadTypes.P1,  text: 'Camera trigger distance' },
    { key: PadTypes.P2,  text: 'Camera trigger angle' },
    { key: PadTypes.P3,  text: 'Visibility trigger' },
  ],
  [Scenes.ASSIOMA]: [
    { key: KnobTypes.K1, text: 'Connection count' },
    { key: KnobTypes.K2, text: 'Connection variation' },
    { key: KnobTypes.K3, text: 'Narrow factor' },
    { key: KnobTypes.K4, text: 'Tunnel speed' },
    { key: KnobTypes.K5, text: 'Pulse frequency 1' },
    { key: KnobTypes.K6, text: 'Pulse frequency 2' },
  ],
  [Scenes.CONFINE]: [
    { key: KnobTypes.K1, text: 'Single motion X' },
    { key: KnobTypes.K2, text: 'Single intensity X' },
    { key: KnobTypes.K3, text: 'Group motion X' },
    { key: KnobTypes.K4, text: 'Group intensity X' },
    { key: KnobTypes.K5, text: 'Group motion Y' },
    { key: KnobTypes.K5, text: 'Scan distance threshold' },
    { key: KnobTypes.K6, text: 'Group intensity Y' },
    { key: KnobTypes.K6, text: 'Scan count factor' },
    { key: PadTypes.P1,  text: 'Camera trigger angle' },
  ],
  [Scenes.DATASET]: [
    { key: KnobTypes.K1, text: 'Camera speed factor' },
    { key: KnobTypes.K2, text: 'Scan chance' },
    { key: KnobTypes.K3, text: 'Scan count factor' },
  ],
  [Scenes.ESGIBTBROT]: [
    { key: KnobTypes.K1, text: 'Bend intensity X' },
    { key: KnobTypes.K2, text: 'Bend intensity Y' },
    { key: KnobTypes.K3, text: 'Bend frequency X' },
    { key: KnobTypes.K4, text: 'Bend frequency Y' },
    { key: KnobTypes.K5, text: 'Pulse frequency 1' },
    { key: KnobTypes.K6, text: 'Pulse frequency 2' },
    { key: KnobTypes.K6, text: 'Narrow factor' },
  ],
  [Scenes.FAKE_OUT]: [
    { key: KnobTypes.K1, text: 'Speed factor 1' },
    { key: KnobTypes.K2, text: 'Speed factor 2' },
    { key: KnobTypes.K3, text: 'Speed factor 3' },
    { key: KnobTypes.K4, text: 'Scale factor 1' },
    { key: KnobTypes.K5, text: 'Scale factor 2' },
    { key: KnobTypes.K6, text: 'Scale factor 3' },
  ],
  [Scenes.FUNCTIII]: [
    { key: KnobTypes.K1, text: 'Scan X range' },
    { key: KnobTypes.K2, text: 'Scan Y range' },
    { key: KnobTypes.K3, text: 'Narrow factor' },
    { key: KnobTypes.K4, text: 'Slope factor' },
    { key: KnobTypes.K5, text: 'Distortion factor' },
    { key: KnobTypes.K6, text: 'Scan chance' },
  ],
  [Scenes.GHOSTSSS]: [
    { key: KnobTypes.K1, text: 'Distortion center' },
    { key: KnobTypes.K2, text: 'Distortion depth' },
    { key: KnobTypes.K3, text: 'Grid distortion 1'},
    { key: KnobTypes.K4, text: 'Grid distortion 2'},
    { key: KnobTypes.K5, text: 'Trigger count' },
    { key: PadTypes.P1,  text: 'Camera trigger angle' },
  ],
  [Scenes.LIKE_NOTHING]: [
    { key: KnobTypes.K1, text: 'Scale factor 1' },
    { key: KnobTypes.K2, text: 'Scale factor 2' },
    { key: KnobTypes.K3, text: 'Scale factor 3' },
    { key: KnobTypes.K4, text: 'Box factor X' },
    { key: KnobTypes.K5, text: 'Box factor Y' },
    { key: KnobTypes.K6, text: 'Box factor Z' },
  ],
  [Scenes.MITTERGRIES]: [
    { key: KnobTypes.K1, text: 'Speed factor' },
    { key: KnobTypes.K2, text: 'Row factor' },
    { key: KnobTypes.K3, text: 'Row factor 3' },
    { key: KnobTypes.K3, text: 'Single factor 3' },
    { key: KnobTypes.K4, text: 'Row factor 4' },
    { key: KnobTypes.K4, text: 'Single factor 4' },
    { key: KnobTypes.K5, text: 'Row factor 5' },
    { key: KnobTypes.K6, text: 'Row factor 6' },
  ],
  [Scenes.MTGO]: [
    { key: KnobTypes.K1, text: 'Amplitude factor' },
    { key: KnobTypes.K2, text: 'Amplitude group 1' },
    { key: KnobTypes.K3, text: 'Amplitude group 2' },
    { key: KnobTypes.K4, text: 'Amplitude group 3' },
    { key: KnobTypes.K5, text: 'Visibility factor' },
    { key: KnobTypes.K6, text: 'Visibility chance' },
  ],
  [Scenes.RFBONGOS]: [
    { key: KnobTypes.K1, text: 'Camera rotation factor' },
  ],
  [Scenes.SISTEMA]: [
    { key: KnobTypes.K1, text: 'Global speed factor' },
    { key: KnobTypes.K2, text: 'Speed factor 1' },
    { key: KnobTypes.K3, text: 'Speed factor 2' },
    { key: KnobTypes.K4, text: 'Speed factor 3' },
    { key: KnobTypes.K5, text: 'Speed factor 4' },
    { key: KnobTypes.K6, text: 'Speed factor 5' },
  ],
  [Scenes.SOLO_01]: [
    { key: KnobTypes.K1, text: 'Speed factor 1' },
    { key: KnobTypes.K2, text: 'Scale factor 1' },
    { key: KnobTypes.K3, text: 'Speed factor 2' },
    { key: KnobTypes.K4, text: 'Scale factor 2' },
    { key: KnobTypes.K5, text: 'Frequency factor' },
  ],
  [Scenes.SOLO_02]: [
    { key: KnobTypes.K1, text: 'Speed factor 1' },
    { key: KnobTypes.K2, text: 'Scale factor 1' },
    { key: KnobTypes.K3, text: 'Speed factor 2' },
    { key: KnobTypes.K4, text: 'Scale factor 2' },
    { key: KnobTypes.K5, text: 'Frequency factor' },
  ],
  [Scenes.SOLO_03]: [
    { key: KnobTypes.K1, text: 'Speed factor 1' },
    { key: KnobTypes.K2, text: 'Scale factor 1' },
    { key: KnobTypes.K3, text: 'Speed factor 2' },
    { key: KnobTypes.K4, text: 'Scale factor 2' },
    { key: KnobTypes.K5, text: 'Frequency factor' },
  ],
  [Scenes.SOLO_04]: [
    { key: KnobTypes.K1, text: 'Speed factor' },
    { key: KnobTypes.K2, text: 'Scale factor' },
    { key: KnobTypes.K3, text: 'Frequency factor' },
  ],
  [Scenes.STAYS_NOWHERE]: [
    { key: KnobTypes.K1, text: 'Scale factor' },
    { key: KnobTypes.K2, text: 'Distance factor 2' },
    { key: KnobTypes.K3, text: 'Distance factor 3' },
    { key: KnobTypes.K4, text: 'Distance factor 4' },
    { key: KnobTypes.K5, text: 'Distance factor 5' },
    { key: KnobTypes.K6, text: 'Camera polar factor' },
  ],
  [Scenes.STRANGE_ATTRACTOR]: [
    { key: KnobTypes.K1, text: 'Orbit Factor 1' },
    { key: KnobTypes.K2, text: 'Orbit Factor 2' },
    { key: KnobTypes.K3, text: 'Orbit Factor 3' },
    { key: KnobTypes.K4, text: 'Camera rotation factor' },
    { key: KnobTypes.K5, text: 'Camera zoom speed' },
    { key: KnobTypes.K6, text: 'Camera zoom factor' },
  ],
  [Scenes.SUPER_JUST]: [
    { key: KnobTypes.K1, text: 'Row factor 1' },
    { key: KnobTypes.K2, text: 'Row visibility 1' },
    { key: KnobTypes.K3, text: 'Row factor 2' },
    { key: KnobTypes.K4, text: 'Row visibility 2' },
    { key: KnobTypes.K5, text: 'Camera zoom factor' },
  ],
  [Scenes.TUFTEEE]: [
    { key: KnobTypes.K1, text: 'Scale factor 1' },
    { key: KnobTypes.K2, text: 'Scale factor 2' },
    { key: KnobTypes.K3, text: 'Scale factor 3' },
    { key: KnobTypes.K4, text: 'Global speed' },
    { key: KnobTypes.K5, text: 'Offset factor' },
    { key: KnobTypes.K6, text: 'Speed factor' },
  ],
  [Scenes.USBTEC]: [
    { key: KnobTypes.K1, text: 'Swirl factor 1' },
    { key: KnobTypes.K2, text: 'Swirl factor 2' },
    { key: KnobTypes.K3, text: 'Swirl factor 3' },
    { key: KnobTypes.K4, text: 'Attraction factor 1' },
    { key: KnobTypes.K5, text: 'Attraction factor 2' },
    { key: KnobTypes.K6, text: 'Attraction factor 3' },
  ],
  [Scenes.ZENO]: [
    { key: KnobTypes.K1, text: 'Speed Factor' },
    { key: KnobTypes.K2, text: 'Push factor' },
    { key: KnobTypes.K3, text: 'Change speed chance' },
    { key: KnobTypes.K4, text: 'Change row chance' },
    { key: KnobTypes.K5, text: 'Camera rotation factor' },
    { key: KnobTypes.K6, text: 'Speed Factor back' },
  ],
  [Scenes.ZOHO]: [
    { key: KnobTypes.K1, text: 'Scan count factor' },
    { key: KnobTypes.K1, text: 'Orbit factor 1' },
    { key: KnobTypes.K2, text: 'Orbit factor 2' },
    { key: KnobTypes.K3, text: 'Orbit factor 3' },
    { key: KnobTypes.K4, text: 'Orbit factor 4' },
    { key: KnobTypes.K5, text: 'Orbit factor 5' },
    { key: KnobTypes.K6, text: 'Orbit factor 6' },
  ],
}

const getControllerBindings = (title: Scenes) => {
  const globalControls = [];

  if (sceneBindings[title]) {
    globalControls.push(...(sceneBindings[title]));
  }

  globalControls.push(...[
    { key: KnobTypes.K7, text: 'Rotate camera' },
    { key: PadTypes.P4,  text: 'Reset audio' },
    { key: PadTypes.P16, text: 'End scene' },
  ])

  return globalControls;
}

</script>

<template>
  <div class="flex">
    <div v-if="currentScene && getControllerBindings(currentScene.title)">
      <UiBox extra-class="w-full">Controller</UiBox>
      <div class="flex-col gap-0">
        <div v-for="({key, text}, i) in getControllerBindings(currentScene.title)" :key="i" class="flex gap-0.25">
          <UiBox extra-class="!p-[1px]" :centered="true">
            <span class="w-8 inline-block px-1 border-1 rounded-sm text-xs">{{ key.replace('knob', 'K').replace('pad', 'P') }}</span>
          </UiBox>
          <UiBox :width="45">
            <span>{{ text }}</span>
            <div
              v-if="controller.knobs[key as KnobTypes]"
              class="absolute top-0 left-0 h-full max-w-full z-[-1] bg-green-500"
              :style="{ width: `${100 * controller.knobs[key as KnobTypes]}%` }">
            </div>
            <div
              v-else-if="controller.pads[key as PadTypes]"
              class="absolute top-0 left-0 h-full max-w-full z-[-1] bg-green-500"
              :style="{ width: `${100 * controller.pads[key as PadTypes]}%` }">
            </div>
          </UiBox>
        </div>
      </div>
    </div>

    <div>
      <UiBox extra-class="w-full">Keyboard</UiBox>
      <div class="flex-col gap-0">
        <div v-for="({key, text}) in keyboardBindings" :key="key" class="flex gap-0.25">
          <UiBox extra-class="!p-[1px]" :centered="true"><span class="w-5 inline-block px-1 border-1 rounded-sm text-xs">{{ key }}</span></UiBox>
          <UiBox :width="45">
            <span>{{ text }}</span>
          </UiBox>
        </div>
      </div>
    </div>
  </div>
</template>