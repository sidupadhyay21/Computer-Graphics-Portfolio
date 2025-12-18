/*jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

/** @type {number} */ let carCount = 0;

export class SimpleCar extends GrObject {
    /** @type {import("../libs/CS559-Framework/GrWorld.js").GrWorld | null} */ world;
    constructor(startX = 0, startZ = 0, speed = 0.01, world = null, isPerpendicular = false) {
        /** @type {T.Group} */ const carGroup = new T.Group();
        super(`Car-${++carCount}`, carGroup);

        // Save movement state
        this.speed = speed;
        this.startZ = startZ;
        this.startX = startX;
        this.world = world;
        this.isPerpendicular = isPerpendicular;

        // Set initial position
        carGroup.position.set(startX, 0, startZ);

        // Set initial rotation for perpendicular cars
        if (isPerpendicular) {
            carGroup.rotation.y = 0; // facing along X
        } else {
            carGroup.rotation.y = Math.PI / 2; // facing along Z
        }

        // List of colors for the car body
        const colors = ["blue", "red", "green", "yellow", "purple", "orange"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // Car body
        const bodyGeom = new T.BoxGeometry(2, 0.5, 1);
        const bodyMat = new T.MeshStandardMaterial({ color: randomColor });
        const body = new T.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.5;
        carGroup.add(body);

        // Wheels
        const wheelGeom = new T.CylinderGeometry(0.2, 0.2, 0.3, 32);
        const wheelMat = new T.MeshStandardMaterial({ color: "black" });

        const wheelPositions = [
            [-0.8, 0.2, 0.5],
            [0.8, 0.2, 0.5],
            [-0.8, 0.2, -0.5],
            [0.8, 0.2, -0.5],
        ];

        for (const pos of wheelPositions) {
            const wheel = new T.Mesh(wheelGeom, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.rotation.y = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            carGroup.add(wheel);
        }

        // Car top (trapezoidal shape)
        const topGeom = new T.CylinderGeometry(0.5, 0.75, 0.5, 4);
        const textureLoader = new T.TextureLoader();
        const windowTexture = textureLoader.load("./car.jpeg");

        windowTexture.wrapS = T.RepeatWrapping;
        windowTexture.wrapT = T.RepeatWrapping;
        windowTexture.repeat.set(4, 1);

        const sideMat = new T.MeshStandardMaterial({ map: windowTexture, side: T.DoubleSide });
        const otherMat = new T.MeshStandardMaterial({ color: randomColor, side: T.DoubleSide });
        const topMatArray = [sideMat, otherMat, sideMat, otherMat];

        const top = new T.Mesh(topGeom, topMatArray);
        top.rotation.y = Math.PI / 4;
        top.position.y = 1;
        carGroup.add(top);
    }

    stepWorld(delta, timeOfDay) {
        const obj = this.objects[0]; // The THREE.Group attached to this GrObject
    
        // Move the car normally
        let moveAmount = this.speed * delta;
    
        // Check for nearby cars
        for (let other of this.world.objects) {
            if (other instanceof SimpleCar && other !== this) {
                const otherObj = other.objects[0];
                if (this.isPerpendicular) {
                    // Only consider cars on the same Z (lane)
                    if (Math.abs(otherObj.position.z - obj.position.z) < 0.5) {
                        // Look ahead: is there another car in front?
                        const dx = otherObj.position.x - obj.position.x;
                        if (dx > 0 && dx < 5) { // If another car is within 5 units in front
                            moveAmount = -0.001; // STOP moving
                            break;
                        }
                    }
                } else {
                    // Only consider cars on the same X (lane)
                    if (Math.abs(otherObj.position.x - obj.position.x) < 0.5) {
                        // Look ahead: is there another car in front of me?
                        const dz = otherObj.position.z - obj.position.z;
                        if (dz > 0 && dz < 5) { // If another car is within 5 units in front
                            moveAmount = 0; // STOP moving
                            break;
                        }
                    }
                }
            }
        }
    
        if (this.isPerpendicular) {
            obj.position.x += moveAmount;

            // Wrap-around when off the road
            if (obj.position.x > 22) {
                obj.position.x = -22;
            }
        } else {
            obj.position.z += moveAmount;

            // Wrap-around when off the road
            if (obj.position.z > 22) {
                obj.position.z = -22;
            }
        }
    }
}
