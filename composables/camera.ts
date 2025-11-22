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
    const { controls, camera } = use3DScene().value;

    const angle = Math.PI / 2; // +90 degrees
    const target = new THREE.Vector3(0, 0, 0);

    // vector from target -> camera
    const v = camera?.position.clone().sub(target);

    // rotate that vector around world Y
    v.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

    // put camera back and look at origin
    camera?.position.copy(v.add(target));
    camera?.lookAt(target);

    // if using OrbitControls, keep its target and update
    controls?.target.copy(target);
    controls?.update();
  }

}

const setCamera = (x: number, y: number, z: number) => {
  const { controls, camera } = use3DScene().value;

  camera?.position.set(x, y, z);
  camera?.lookAt(0, 0, 0);
  controls?.target.set(0, 0, 0);
  controls?.update();
}