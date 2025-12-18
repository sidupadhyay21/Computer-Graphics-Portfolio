/*jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

/** @type {number} */ let bikeCount = 0;

export class SimpleBike extends GrObject {
    constructor(sideLength = 10, speed = 0.01) {
        /** @type {T.Group} */ const bikeGroup = new T.Group();
        super(`Bike-${++bikeCount}`, bikeGroup);

        this.halfSide = sideLength / 2;
        this.speed = speed;
        this.angle = 0;
        this.currentSegment = 0;
        this.positionOnSegment = 0;
        this.targetRotation = 0; // Target rotation for smooth transitions

        // Bike Body
        const frameGeom = new T.BoxGeometry(0.75, 0.075, 0.05);
        const frameMat = new T.MeshStandardMaterial({ color: "blue" });
        const frame = new T.Mesh(frameGeom, frameMat);
        frame.position.y = 0.25;
        bikeGroup.add(frame);
        this.rideable = frame;

        // Wheels
        const textureLoader = new T.TextureLoader();
        const tireTexture = textureLoader.load("./tire.jpg");
        tireTexture.wrapS = T.RepeatWrapping;
        tireTexture.wrapT = T.RepeatWrapping;
        tireTexture.repeat.set(1, 1);

        const wheelGeom = new T.TorusGeometry(0.25, 0.05, 16, 100);
        const wheelMat = new T.MeshStandardMaterial({ map: tireTexture });

        this.frontWheel = new T.Mesh(wheelGeom, wheelMat);
        this.frontWheel.position.set(0.375, 0.25, 0);
        this.frontWheel.rotation.set(0, 0, Math.PI / 2);
        bikeGroup.add(this.frontWheel);

        this.backWheel = new T.Mesh(wheelGeom, wheelMat);
        this.backWheel.position.set(-0.375, 0.25, 0); 
        this.backWheel.rotation.set(0, 0, Math.PI / 2);
        bikeGroup.add(this.backWheel);

        // Handlebar
        const handleGeom = new T.BoxGeometry(0.25, 0.025, 0.025);
        const handleMat = new T.MeshStandardMaterial({ color: "black" });
        const handle = new T.Mesh(handleGeom, handleMat);
        handle.position.set(0.2, 0.6, 0);
        handle.rotation.y = Math.PI / 2;
        bikeGroup.add(handle);

        // Rider Body
        const riderGeom = new T.BoxGeometry(0.15, 0.3, 0.1);
        const riderMat = new T.MeshStandardMaterial({ color: "red" });
        const rider = new T.Mesh(riderGeom, riderMat);
        rider.position.set(0, 0.55, 0);
        bikeGroup.add(rider);

        // Rider Head
        const headGeom = new T.SphereGeometry(0.1, 16, 16);
        const headMat = new T.MeshStandardMaterial({ color: "peachpuff" });
        const head = new T.Mesh(headGeom, headMat);
        head.position.set(0, 0.75, 0);
        bikeGroup.add(head);
    }

    stepWorld(delta, timeOfDay) {
        const obj = this.objects[0];
        const moveAmount = this.speed * delta;
        this.positionOnSegment += moveAmount;

        if (this.positionOnSegment >= this.halfSide * 2) {
            this.positionOnSegment = 0;
            this.currentSegment = (this.currentSegment + 1) % 4;
        }

        let x = 0, z = 0;

        switch (this.currentSegment) {
            case 0: // Right
                x = -this.halfSide + this.positionOnSegment;
                z = -this.halfSide;
                this.targetRotation = 0;
                break;
            case 1: // Up
                x = this.halfSide;
                z = -this.halfSide + this.positionOnSegment;
                this.targetRotation = 3 * Math.PI / 2;
                break;
            case 2: // Left
                x = this.halfSide - this.positionOnSegment;
                z = this.halfSide;
                this.targetRotation = Math.PI;
                break;
            case 3: // Down
                x = -this.halfSide;
                z = this.halfSide - this.positionOnSegment;
                this.targetRotation = Math.PI / 2;
                break;
        }

        obj.position.set(x, 0, z);

        // Smoothly interpolate rotation
        const rotationSpeed = 0.05; // Adjust for smoother or faster transitions
        obj.rotation.y += (this.targetRotation - obj.rotation.y) * rotationSpeed;

        // Wheel Spin (assuming wheel radius 0.5) 
        const wheelRotation = moveAmount / 0.5;
        this.frontWheel.rotation.z -= wheelRotation;
        this.backWheel.rotation.z -= wheelRotation;
    }
}
