import { reactive } from 'vue';
import type { ProjectedPoint } from '~/data/types';

// The store: Nested Maps categorized by "Set Name"
// Example structure: { "particles": Map(id => point), "scans": Map(id => point) }
const screenPositions = reactive(new Map<string, Map<number, ProjectedPoint>>());
const sceneData = reactive(new Map<string, any>());

export const useSceneBridge = () => {
  const scene3D = useScene3D();

  /**
   * SETS & POSITIONS
   */

  const setScreenPosition = (setName: string, index: number, point: ProjectedPoint) => {
    if (!screenPositions.has(setName)) {
      screenPositions.set(setName, new Map());
    }
    screenPositions.get(setName)!.set(index, point);
  };

  const setScreenPositions = (setName: string, points: ProjectedPoint[]) => {
    if (!screenPositions.has(setName)) {
      screenPositions.set(setName, new Map());
    }
    points.forEach((point, index) => {
      screenPositions.get(setName)!.set(index, point);
    })
  };

  const getScreenPosition = (setName: string, index: number) => {
    return screenPositions.get(setName)?.get(index);
  };

  const getScreenSet = (setName: string) => {
    return screenPositions.get(setName);
  };

  const removeScreenPosition = (setName: string, index: number) => {
    screenPositions.get(setName)?.delete(index);
  };

  const clearScreenSet = (setName: string) => {
    screenPositions.get(setName)?.clear();
  };

  const clearAllScreenPositions = () => {
    screenPositions.clear();
  };

  /**
   * 3D ENGINE INTEGRATION
   */

  const setInstancesScreenPositions = (setName: string, shapeId: string, pointsIndices: number[], data?: any[]) => {
    scene3D.value?.addInstancesScreenPosition(setName, shapeId, pointsIndices, data);
  }

  const removeInstancesScreenPositions = (setName: string, shapeId: string, pointsIndices: number[]) => {
    scene3D.value?.removeInstancesScreenPosition(setName, shapeId, pointsIndices);
  }

  /**
   * GENERAL SCENE DATA
   */

  const getSceneData = (key: string) => {
    return sceneData.get(key);
  }

  const setSceneData = (key: string, value: any) => {
    sceneData.set(key, value)
  }

  const removeSceneData = (key?: string) => {
    if (key) {
      sceneData.delete(key)
    } else {
      sceneData.clear();
    }
  }

  return {
    // State
    screenPositions,
    sceneData,
    
    // Position Methods
    setScreenPosition,
    setScreenPositions,
    getScreenPosition,
    getScreenSet,
    removeScreenPosition,
    clearScreenSet,
    clearAllScreenPositions,
    
    // 3D Methods
    setInstancesScreenPositions,
    removeInstancesScreenPositions,
    
    // Data Methods
    getSceneData,
    setSceneData,
    removeSceneData,
  };
};