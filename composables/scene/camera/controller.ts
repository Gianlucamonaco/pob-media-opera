import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/Addons.js';

export class CameraController {
  private _spherical = new THREE.Spherical();
  private _tempVec = new THREE.Vector3();
  private _targetVec = new THREE.Vector3();

  constructor(
    private camera: THREE.PerspectiveCamera,
    private controls?: OrbitControls,
  ) {}

/* ------------------------------
   Getters
   ------------------------------ */

   getPosition () {
    return this.camera.position;
  }

  getOrbitAngles() {
    const target = this.controls?.target || this._targetVec.set(0, 0, 0);
    
    // Calculate offset from target to camera
    this._tempVec.subVectors(this.camera.position, target);
    this._spherical.setFromVector3(this._tempVec);

    const radius = this._spherical.radius;

    // Theta is the horizontal angle (0 to 360)
    const azimuth = THREE.MathUtils.radToDeg(this._spherical.theta);

    // Phi is the vertical angle (0 = top, 90 = horizon, 180 = bottom)
    const polar = THREE.MathUtils.radToDeg(this._spherical.phi);

    // Elevation as alternative (0 = horizon, 90 = top)
    const elevation = 90 - polar;

    return {
      azimuth, 
      polar, 
      elevation,
      radius,
    };
  }

/* ------------------------------
   Setters
   ------------------------------ */

  setFov(value: number) {
    this.camera.fov = value;
    this.camera.updateProjectionMatrix();
  }

  setPosition(x: number, y: number, z: number) {
    this.camera.position.set(x, y, z);
    
    // Instead of hardcoded 0,0,0, look at the existing target
    const target = this.controls?.target || this._targetVec.set(0, 0, 0);
    this.lookAt(target.x, target.y, target.z);
  }

  lookAt(x: number, y: number, z: number) {
    this.camera.lookAt(x, y, z);
    if (this.controls) {
      this.controls.target.set(x, y, z);
      this.controls.update();
    }
  }

  rotate(azimuthDeg: number, polarDeg: number, rollDeg = 0) {
    if (!this.controls) return;

    const target = this.controls.target;
    const radius = this.camera.position.distanceTo(target);

    // Set spherical from degrees
    this._spherical.set(
      radius,
      THREE.MathUtils.degToRad(polarDeg),
      THREE.MathUtils.degToRad(azimuthDeg),
    );

    // Convert to Cartesian relative to target
    this._tempVec.setFromSpherical(this._spherical);
    this.camera.position.copy(target).add(this._tempVec);

    // Apply roll (Note: OrbitControls may override this on interaction)
    this.camera.rotation.z = THREE.MathUtils.degToRad(rollDeg);
    
    this.camera.lookAt(target);
    this.controls.update();
  }

  zoom(amount: number) {
    if (!this.controls) return;

    const target = this.controls.target;
    const dir = this._tempVec.subVectors(this.camera.position, target).normalize();

    this.camera.position.addScaledVector(dir, amount);
    this.controls.update();
  }
}