// const gl = await
var width   = 64
var height  = 64
var gl = (await import('gl')).default(600,600, { preserveDrawingBuffer: true })
// https://npmjs.com/package/gl v4.9.0
const THREE = await import("three"); // https://npmjs.com/package/three v0.124.0
const fs = await import("fs");

// console.log(gl.default(100,100, { preserveDrawingBuffer: true }))

const {scene, camera} = createScene();
const renderer = createRenderer({width: 200, height: 200});
renderer.render(scene, camera);

let image = extractPixels(renderer.getContext());

console.time("100 f");
for(let i = 0; i< 100; i++){
  image = extractPixels(renderer.getContext());
}
fs.writeFileSync("test.ppm", toP3(image));
console.timeEnd("100 f");

process.exit(0);

function createScene() {
  const scene = new THREE.Scene();

  const box = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial());
  box.position.set(0, 0, 1);
  box.castShadow = true;
  scene.add(box);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial());
  ground.receiveShadow = true;
  scene.add(ground);

  const light = new THREE.PointLight();
  light.position.set(3, 3, 5);
  light.castShadow = true;
  scene.add(light);

  const camera = new THREE.PerspectiveCamera();
  camera.up.set(0, 0, 1);
  camera.position.set(-3, 3, 3);
  camera.lookAt(box.position);
  scene.add(camera);
  
  return {scene, camera};
}

function createRenderer({height, width}) {
  // THREE expects a canvas object to exist, but it doesn't actually have to work.
  const canvas = {
    width,
    height,
    addEventListener: event => {},
    removeEventListener: event => {},
  };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
    context: gl,
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default PCFShadowMap

  // This is important to enable shadow mapping. For more see:
  // https://threejsfundamentals.org/threejs/lessons/threejs-rendertargets.html and
  // https://threejsfundamentals.org/threejs/lessons/threejs-shadows.html
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
  });

  renderer.setRenderTarget(renderTarget);
  return renderer;
}

function extractPixels(context) {
  const width = context.drawingBufferWidth;
  const height = context.drawingBufferHeight;
  const frameBufferPixels = new Uint8Array(width * height * 4);
  context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, frameBufferPixels);
  // The framebuffer coordinate space has (0, 0) in the bottom left, whereas images usually
  // have (0, 0) at the top left. Vertical flipping follows:
  const pixels = new Uint8Array(width * height * 4);
  for (let fbRow = 0; fbRow < height; fbRow += 1) {
    let rowData = frameBufferPixels.subarray(fbRow * width * 4, (fbRow + 1) * width * 4);
    let imgRow = height - fbRow - 1;
    pixels.set(rowData, imgRow * width * 4);
  }
  return {width, height, pixels};
}

function toP3({width, height, pixels}) {
  const headerContent = `P3\n# http://netpbm.sourceforge.net/doc/ppm.html\n${width} ${height}\n255\n`;
  const bytesPerPixel = pixels.length / width / height;
  const rowLen = width * bytesPerPixel;

  let output = headerContent;
  for (let i = 0; i < pixels.length; i += bytesPerPixel) {
    // Break output into rows
    if (i > 0 && i % rowLen === 0) {
      output += "\n";
    }
    for (let j = 0; j < 3; j += 1) {
      // This is super inefficient but hey
      output += pixels[i + j] + " ";
    }
  }

  return output;
}