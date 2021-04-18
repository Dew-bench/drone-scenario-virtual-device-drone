const THREE = await import("three"); // https://npmjs.com/package/three v0.124.0 !important
const fs = await import("fs");
const gl = await import('gl')
import {toP3, extractPixels, toJPG} from './imageHelper.js'
import {Color} from "three";

/*
    Virtual Camera

    - init with camera width and height
    - to get a frame :
        let new_frame = vCamera.renderFrame().getFrame();
 */

class vCamera {
    constructor(width, height) {
        this.width = width
        this.height = height

        this.targetOrientation = { // Euler Angles
            x: 0,
            y: 0,
            z: 0
        }

        this.targetLocation = {
            x: 0,
            y: 0,
            z: 0
        }

        this.createScene()
        this.createRenderer(this.width, this.height)

        return this;
    }

    renderFrame(){
        this.renderer.render(this.scene, this.camera);
        this.frame = extractPixels(this.renderer.getContext());
        return this;
    }

    getFrame(){
        return this.frame;
    }

    frameToP3File(filename){
        fs.writeFileSync(`${filename}.ppm`, toP3(this.frame));
    }

    frameToJPGFile(filename){
        toJPG(this.frame).toFile(filename+".jpg")
    }

    frameToJPG(){
        return toJPG(this.frame);
    }

    translateZ(distance_units){
        this.camera.translateZ(distance_units)
    }

    translateX(distance_units){
        this.camera.translateX(distance_units)
    }

    translateY(distance_units){
        this.camera.translateY(distance_units)
    }

    setTarget(location, orientation){
        this.targetLocation = location;
        this.targetOrientation = orientation;
        this.moveToTarget()
    }

    moveToTarget(){
        this.translateX(this.targetLocation.x)
        this.translateY(this.targetLocation.y)
        this.translateZ(this.targetLocation.z)
        // console.log(this.targetLocation)
    }

    createRenderer(width, height){
        const canvas = {
            width,
            height,
            addEventListener: event => {},
            removeEventListener: event => {},
        };

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false,
            powerPreference: "high-performance",
            context: gl.default(width,height, { preserveDrawingBuffer: true }),
        });

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
        });

        this.renderer.setRenderTarget(renderTarget);
    }

    createScene(){
        this.scene = new THREE.Scene();

        const box = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial());
        box.position.set(3, 3, 1);
        box.castShadow = true;
        this.scene.add(box);

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial());
        ground.receiveShadow = true;
        this.scene.add(ground);

        const light = new THREE.PointLight();
        light.position.set(3, 3, 5);
        light.castShadow = true;
        this.scene.add(light);

        this.camera = new THREE.PerspectiveCamera();
        this.camera.up.set(0, 0, 1);
        this.camera.position.set(-3, 3, 3);
        this.camera.lookAt(box.position);
    }
}

export default vCamera;