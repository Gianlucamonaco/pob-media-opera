import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/Addons.js';

export class CameraController {
  constructor(
    private camera: THREE.Camera,
    private controls?: OrbitControls,
  ) {}

  getPosition () {
    return this.camera.position;
  }

  getOrbitAngles() {
    const spherical = new THREE.Spherical().setFromVector3(this.camera.position);

    // Phi is the vertical angle (0 = top, 90 = horizon, 180 = bottom)
    // Theta is the horizontal angle
    const polar = THREE.MathUtils.radToDeg(spherical.phi); 
    const azimuth = THREE.MathUtils.radToDeg(spherical.theta);
    const elevation = 90 - polar; // (0 = horizon, 90 = top)

    return { 
      polar, 
      azimuth,
      elevation 
    };
  }

  setPosition (x: number, y: number, z: number) {
    this.camera.position.set(x, y, z);
    this.lookAt(0, 0, 0);
  }

  lookAt (x: number, y: number, z: number) {
    this.camera.lookAt(x, y, z);
    this.controls?.target.set(x, y, z);
    this.controls?.update();
  }

  rotate (rxDeg: number, ryDeg: number, rzDeg = 0) {
    if (!this.controls) return;

    const target = this.controls.target.clone();
    const radius = this.camera.position.distanceTo(target);

    const rx = THREE.MathUtils.degToRad(rxDeg);
    const ry = THREE.MathUtils.degToRad(ryDeg);

    this.camera.position.set(
      target.x + radius * Math.cos(ry) * Math.sin(rx),
      target.y + radius * Math.sin(ry),
      target.z + radius * Math.cos(ry) * Math.cos(rx)
    );

    this.camera.rotation.z = THREE.MathUtils.degToRad(rzDeg);
    this.camera.lookAt(target);
    this.controls.update();
  }

  zoom (amount: number) {
    if (!this.controls) return;

    const dir = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();

    this.camera.position.addScaledVector(dir, amount);
    this.controls.update();
  }
}