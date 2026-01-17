// A simple shader to draw a sharp ring on a square plane using UVs
export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uIndex; // 0 to 3
  uniform float uThickness; // 0.0 to 0.5

  void main() {
    // Calculate distance from center of the UV (0.5, 0.5)
    // vUv is 0,0 top-left and 1,1 bottom-right
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);
    
    // Create the ring using step (HARD EDGE, NO GRADIENT)
    // We want pixels where dist is ~ 0.5
    // Outer edge: dist < 0.5
    // Inner edge: dist > (0.5 - thickness)
    float outerCircle = step(dist, 0.5);
    float innerCircle = step(dist, 0.5 - uThickness);
    
    // Subtract inner from outer to get the ring
    float ring = outerCircle - innerCircle;

    if (ring < 0.5) discard; // Cut out the empty space
    
    gl_FragColor = vec4(uColor, 1.0);
  }
`;