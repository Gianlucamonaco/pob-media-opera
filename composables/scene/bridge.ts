import { reactive } from 'vue';
import type { ProjectedPoint } from '~/data/types';

// Store normalized coordinates (0 to 1) so 2D doesn't care about 3D's resolution
const screenPositions = reactive(new Map<number, ProjectedPoint>());

const trackPositions = reactive(new Map<number, ProjectedPoint>());

export const useSceneBridge = () => {
  const scene3D = useScene3D();

  const setScreenPosition = (index: number, points: ProjectedPoint) => {
    screenPositions.set(index, points);
  };

  const getScreenPosition = (index: number) => {
    return screenPositions.get(index);
  };

  const removeScreenPosition = (index: number) => {
    screenPositions.delete(index);
  };

  const removeScreenPositions = () => {
    screenPositions.forEach((_, key) => {
      screenPositions.delete(key);
    })
  };

  const setTrackPosition = (index: number, points: ProjectedPoint) => {
    trackPositions.set(index, points);
  };

  const getTrackPosition = (index: number) => {
    return trackPositions.get(index);
  };

  const removeTrackPosition = (index: number) => {
    trackPositions.delete(index);
  };

  const removeTrackPositions = () => {
    trackPositions.forEach((_, key) => {
      trackPositions.delete(key);
    })
  };

  const setInstancesScreenPositions = (shapeId: string, pointsIndices: number[], data?: any[]) => {
    scene3D.value?.addInstancesScreenPosition(shapeId, pointsIndices, data);
  }

  const removeInstancesScreenPositions = (shapeId: string, pointsIndices: number[]) => {
    scene3D.value?.removeInstancesScreenPosition(shapeId, pointsIndices);
  }

  return {
    setScreenPosition,
    getScreenPosition,
    removeScreenPosition,
    removeScreenPositions,
    screenPositions,
    setTrackPosition,
    getTrackPosition,
    removeTrackPosition,
    removeTrackPositions,
    trackPositions,
    setInstancesScreenPositions,
    removeInstancesScreenPositions,
  };
};