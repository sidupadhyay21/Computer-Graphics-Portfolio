/*jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrWorld } from "../libs/CS559-Framework/GrWorld.js";
import { WorldUI } from "../libs/CS559-Framework/WorldUI.js";
import { main } from "./main.js";
import { OBJLoader } from "../libs/CS559-Three/examples/jsm/loaders/OBJLoader.js";
import { ColladaLoader } from "../libs/CS559-Three/examples/jsm/loaders/ColladaLoader.js";

// make the world
let world = new GrWorld({
    width: 800,
    height: 600,
    groundplanesize: 20,
    shadows: true, // Enable shadow support in GrWorld
    where: document.getElementById("div1")
});

// Load environment map
const loader = new T.CubeTextureLoader();
const envMap = loader.load([
    "./P2-sidupadhyay21/for_students/px.png", 
    "./P2-sidupadhyay21/for_students/nx.png", 
    "./P2-sidupadhyay21/for_students/py.png", 
    "./P2-sidupadhyay21/for_students/ny.png", 
    "./P2-sidupadhyay21/for_students/pz.png", 
    "./P2-sidupadhyay21/for_students/nz.png"
]);
world.scene.background = envMap;

// Add a directional light that casts shadows
const dirLight = new T.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 5000;
world.scene.add(dirLight);

// Optional: add a helper
// const lightHelper = new T.DirectionalLightHelper(dirLight, 1);
// world.scene.add(lightHelper);

// Enable shadows
world.renderer.shadowMap.enabled = true;
world.scene.traverse(obj => {
    if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
    }
});

// Hook up the intensity slider
document.getElementById("intensityRange").addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    dirLight.intensity = value;
    document.getElementById("intensityValue").textContent = value.toFixed(2);
});

// helper to visualize shadow area
// world.scene.add(new T.CameraHelper(sunlight.shadow.camera));

const ambientLight = new T.AmbientLight(0x404040); // soft light
world.scene.add(ambientLight);

// Reflective object
const sphereGeometry = new T.SphereGeometry(1.5, 32, 32);
const sphereMaterial = new T.MeshStandardMaterial({ envMap: envMap, metalness: 1, roughness: 0 });
const sphere = new T.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(-19, 1.4, 0);
sphere.castShadow = true;
sphere.receiveShadow = true;
world.scene.add(sphere);

// load fountain object
/**@type{T.Object3D} */ let fountain;
let loader2 = new ColladaLoader();
loader2.load("./P2-sidupadhyay21/for_students/horse_fountain/horse_fountain.dae", function (collada) {
    fountain = collada.scene;
    fountain.position.set(0, 0, 0);
    fountain.scale.set(3, 3, 3);
    fountain.rotation.set(-Math.PI/2, 0, 0);
    fountain.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    world.scene.add(fountain);
});

// Call student-defined objects
main(world);

// Highlighting objects by name
function highlight(obName) {
    const toHighlight = world.objects.find(ob => ob.name === obName);
    if (toHighlight) {
        toHighlight.highlighted = true;
    } else {
        throw `no object named ${obName} for highlighting!`;
    }
}

// You should replace these with your own object names:
highlight("Skyscraper-5");
highlight("Helicopter-0");
highlight("Car-1");
highlight("Bird-1");
highlight("AppleTree");
highlight("Bike-1");

// Build and run the UI
world.ui = new WorldUI(world, 500, document.getElementById("world-controls-container"), false);
world.go();
