import { reactive } from 'vue';
import type { ProjectedPoint } from '~/data/types';

// Store normalized coordinates (0 to 1) so 2D doesn't care about 3D's resolution
const screenPositions = reactive(new Map<number, ProjectedPoint>());

export const useSceneBridge = () => {
  const scene3D = useScene3D();

  const setScreenPosition = (id: number, points: ProjectedPoint) => {
    screenPositions.set(id, points);
  };

  const getScreenPosition = (id: number) => {
    return screenPositions.get(id) || [];
  };

  const removeScreenPosition = (id: number) => {
    screenPositions.delete(id);
  };

  const removeScreenPositions = () => {
    screenPositions.forEach((_, key) => {
      screenPositions.delete(key);
    })
  };

  const setInstancesScreenPositions = (id: string, pointsId: number[]) => {
    scene3D.value?.addInstancesScreenPosition(id, pointsId);
  }

  const removeInstancesScreenPositions = (id: string, pointsId: number[]) => {
    scene3D.value?.removeInstancesScreenPosition(id, pointsId);
  }

  return {
    setScreenPosition,
    getScreenPosition,
    removeScreenPosition,
    removeScreenPositions,
    screenPositions,
    setInstancesScreenPositions,
    removeInstancesScreenPositions,
  };
};