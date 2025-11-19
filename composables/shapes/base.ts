import * as THREE from "three";
import { useScene } from "../general";

export class Base {
  mesh: THREE.InstancedMesh | THREE.Mesh;
  geometry: THREE.PlaneGeometry | THREE.CircleGeometry | THREE.RingGeometry;
  material: THREE.MeshBasicMaterial | THREE.ShaderMaterial;

  constructor(params: any) {
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, 1);
  }

  update () {
  }

  dispose () {
    const scene = useScene();

    scene.value.remove(this.mesh);
    this.mesh.dispose();
  }
}