import * as THREE from "three";

export const cameraEvents = {

  // set camera to given position (x, y, z)
  SET: (x: number, y: number, z: number) => {
    setCamera(x, y, z);
  },

  // reset camera: position (0, 0, 100) lookAt (0, 0, 0)
  RESET: (time?: number) => {
    setCamera(0, 0, 100);
  },

  ROTATE_90: (time?: number) => {
    const controls = use3DOrbitControls();
    const camera = use3DCamera();

    const angle = Math.PI / 2; // +90 degrees
    const target = new THREE.Vector3(0, 0, 0);

    // vector from target -> camera
    const v = camera.value?.position.clone().sub(target);

    // rotate that vector around world Y
    v.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

    // put camera back and look at origin
    camera.value?.position.copy(v.add(target));
    camera.value?.lookAt(target);

    // if using OrbitControls, keep its target and update
    controls.value?.target.copy(target);
    controls.value?.update();
  }

}

const setCamera = (x: number, y: number, z: number) => {
  const controls = use3DOrbitControls();
  const camera = use3DCamera();

  camera.value?.position.set(x, y, z);
  camera.value?.lookAt(0, 0, 0);
  controls.value?.target.set(0, 0, 0);
  controls.value?.update();
}