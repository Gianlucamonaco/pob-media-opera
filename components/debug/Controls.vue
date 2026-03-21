<script setup lang="ts">
import { midiState } from '~/composables/controls/MIDI';
import { Scenes } from '~/data/constants';

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

enum KnobTypes {
  K1 = 'knob1',
  K2 = 'knob2',
  K3 = 'knob3',
  K4 = 'knob4',
  K5 = 'knob5',
  K6 = 'knob6',
}

enum PadTypes {
  P1 = 'pad1',
  P2 = 'pad2',
  P3 = 'pad3',
  P4 = 'pad4',
}

const controllerBindings: Partial<Record<Scenes, { key: string, text: string }[]>> = {
  [Scenes.ASFAY]: [
    { key: KnobTypes.K2, text: 'Rect rotation 1' },
    { key: KnobTypes.K3, text: 'Rect rotation 2' },
    { key: KnobTypes.K4, text: 'Rect rotation 3' },
    { key: KnobTypes.K5, text: 'Rect rotation 4' },
    { key: KnobTypes.K6, text: 'Text visibility chance' },
  ],
  [Scenes.CONFINE]: [
    { key: KnobTypes.K2, text: 'Single intensity X' },
    { key: KnobTypes.K3, text: 'Group intensity X' },
    { key: KnobTypes.K4, text: 'Group intensity Y' },
    { key: KnobTypes.K5, text: 'Scan distance' },
    { key: PadTypes.P1, text: 'Camera change' },
  ],
  [Scenes.ESGIBTBROT]: [
    { key: KnobTypes.K2, text: 'Deformation speed 1' },
    { key: KnobTypes.K3, text: 'Deformation speed 2' },
    { key: KnobTypes.K4, text: 'Camera speed X' },
  ],
  [Scenes.FUNCTIII]: [
    { key: KnobTypes.K2, text: 'Narrow factor' },
    { key: KnobTypes.K3, text: 'Slope factor' },
  ],
  [Scenes.GHOSTSSS]: [
    { key: KnobTypes.K2, text: 'Distortion center' },
    { key: KnobTypes.K3, text: 'Distortion depth' },
    { key: KnobTypes.K4, text: 'Trigger count' },
    { key: PadTypes.P1, text: 'Camera change' },
  ],
  [Scenes.MITTERGRIES]: [
    { key: KnobTypes.K2, text: 'Row 1+4, Single 3' },
    { key: KnobTypes.K3, text: 'Row 2+5, Single 4' },
    { key: KnobTypes.K4, text: 'Row 3, Single 2' },
    { key: KnobTypes.K5, text: 'Row 6, Single 2' },
  ],
  [Scenes.MTGO]: [
    { key: KnobTypes.K2, text: 'Amplitude group 1' },
    { key: KnobTypes.K3, text: 'Amplitude group 2' },
    { key: KnobTypes.K4, text: 'Amplitude group 3' },
  ],
  [Scenes.SISTEMA]: [
    { key: KnobTypes.K2, text: 'Speed factor 1+4' },
    { key: KnobTypes.K3, text: 'Position factor 1+4' },
    { key: KnobTypes.K4, text: 'Speed factor 2+5' },
    { key: KnobTypes.K5, text: 'Position factor 2+5' },
  ],
  [Scenes.SOLO_02]: [
    { key: KnobTypes.K2, text: 'Speed factor 2' },
    { key: KnobTypes.K3, text: 'Scale factor 2' },
  ],
  [Scenes.SOLO_03]: [
    { key: KnobTypes.K2, text: 'Speed factor 2' },
    { key: KnobTypes.K3, text: 'Scale factor 2' },
  ],
  [Scenes.SOLO_04]: [
    { key: KnobTypes.K2, text: 'Scale factor' },
    { key: KnobTypes.K3, text: 'Frequency factor' },
  ],
  [Scenes.STAYS_NOWHERE]: [
    { key: KnobTypes.K2, text: 'Distance factor 2' },
    { key: KnobTypes.K3, text: 'Distance factor 3' },
    { key: KnobTypes.K4, text: 'Distance factor 4' },
    { key: KnobTypes.K5, text: 'Distance factor 5' },
  ],
  [Scenes.SUPER_JUST]: [
    { key: KnobTypes.K2, text: 'Row factor 1' },
    { key: KnobTypes.K3, text: 'Row factor 2' },
    { key: KnobTypes.K4, text: 'Row visibility 1' },
    { key: KnobTypes.K5, text: 'Row visibility 2' },
  ],
  [Scenes.ZOHO]: [
    { key: KnobTypes.K2, text: 'Orbit 1' },
    { key: KnobTypes.K3, text: 'Orbit 2, Amplitude 1' },
    { key: KnobTypes.K4, text: 'Orbit 3, Amplitude 2' },
    { key: KnobTypes.K5, text: 'Amplitude 3' },
  ],
  // [Scenes.A]: [
  // ],
}

</script>

<template>
  <div class="flex">
    <div v-if="controllerBindings[currentScene?.title || Scenes.STOP]">
      <UiBox extra-class="w-full">Controller</UiBox>
      <div class="flex-col gap-0">
        <div v-for="({key, text}) in controllerBindings[currentScene?.title || Scenes.STOP]" :key="key" class="flex gap-0.25">
          <UiBox extra-class="!p-[1px]" :centered="true">
            <span class="w-8 inline-block px-1 border-1 rounded-sm text-xs">{{ key.replace('knob', 'K').replace('pad', 'P') }}</span>
          </UiBox>
          <UiBox :width="45">
            <div>{{ text }}</div>
            <div
              v-if="controller.knobs[key as KnobTypes]"
              class="absolute top-0 left-0 h-full max-w-full z-[-1] bg-green-500"
              :style="{ width: `${100 * controller.knobs[key as KnobTypes]}%` }">
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
          <UiBox :width="45">{{ text }}</UiBox>
        </div>
      </div>
    </div>
  </div>
</template>