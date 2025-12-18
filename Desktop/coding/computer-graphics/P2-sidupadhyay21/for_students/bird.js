/*jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

/** @type {number} */ let birdCount = 0;

export class Bird extends GrObject {
    constructor(world, radius = 5, speed = 0.0005, color = "brown") { // Added color parameter
        // Set up an empty group and call the GrObject constructor
        /** @type {T.Group} */ const birdGroup = new T.Group();
        super(`Bird-${++birdCount}`, birdGroup);

        this.world = world;
        this.radius = radius;
        this.speed = speed;
        this.angle = 0;
        this.wingFlapAngle = 0;
        this.wingFlapSpeed = 0.05;
        this.isLanded = false;
        this.landingTimer = 0;
        this.landingTarget = null;
        this.isTakingOff = false;
        this.cooldownTimer = 0; // Cooldown period after takeoff

        // Bird body
        const bodyGeom = new T.SphereGeometry(0.25, 16, 16); // Reduced size
        const bodyMat = new T.MeshStandardMaterial({ color: color }); // Use color parameter
        const body = new T.Mesh(bodyGeom, bodyMat);
        birdGroup.add(body);
        this.rideable = body;

        // Bird head
        const headGeom = new T.SphereGeometry(0.15, 16, 16); // Reduced size
        const headMat = new T.MeshStandardMaterial({ color: color }); // Use color parameter
        const head = new T.Mesh(headGeom, headMat);
        head.position.set(0, 0.3, 0); // Adjusted position
        birdGroup.add(head);

        // Bird beak
        const beakGeom = new T.ConeGeometry(0.05, 0.15, 16); // Reduced size
        const beakMat = new T.MeshStandardMaterial({ color: "orange" });
        const beak = new T.Mesh(beakGeom, beakMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.3, 0.15); // Adjusted position
        birdGroup.add(beak);

        // Wings
        const wingGeom = new T.BoxGeometry(0.6, 0.05, 0.25); // Reduced size
        const wingMat = new T.MeshStandardMaterial({ color: "gray" });

        this.leftWing = new T.Mesh(wingGeom, wingMat);
        this.leftWing.position.set(-0.375, 0.125, 0); // Adjusted position
        birdGroup.add(this.leftWing);

        this.rightWing = new T.Mesh(wingGeom, wingMat);
        this.rightWing.position.set(0.375, 0.125, 0); // Adjusted position
        birdGroup.add(this.rightWing);

        // Feathers
        const featherGeom = new T.ConeGeometry(0.05, 0.15, 8); // Reduced size
        const featherMat = new T.MeshStandardMaterial({ color: "white" });

        for (let i = -0.2; i <= 0.2; i += 0.1) { // Adjusted range and spacing
            const feather = new T.Mesh(featherGeom, featherMat);
            feather.rotation.x = Math.PI / 2;
            feather.position.set(i, 0.25, -0.15); // Adjusted position
            birdGroup.add(feather);
        }

        // Tail
        const tailGeom = new T.ConeGeometry(0.1, 0.25, 8); // Reduced size
        const tailMat = new T.MeshStandardMaterial({ color: color }); // Use color parameter
        const tail = new T.Mesh(tailGeom, tailMat);
        tail.rotation.x = -Math.PI / 2;
        tail.position.set(0, 0.1, -0.25); // Adjusted position
        birdGroup.add(tail);

        // Initial position (off-screen)
        birdGroup.position.set(-20, 10, -20);
        this.birdGroup = birdGroup;
    }

    stepWorld(delta, timeOfDay) {
        const obj = this.birdGroup;

        if (this.cooldownTimer > 0) {
            // Decrement cooldown timer
            this.cooldownTimer -= delta;
            // Resume circular flying during cooldown
            this.angle += this.speed * delta;
            obj.position.x = this.radius * Math.cos(this.angle);
            obj.position.z = this.radius * Math.sin(this.angle);
            obj.position.y = 10 + Math.sin(this.angle * 2); // Add some vertical motion

            // Update orientation
            this.updateOrientation(obj, -Math.sin(this.angle), 0, Math.cos(this.angle));

            // Resume wing flapping
            this.wingFlapAngle += this.wingFlapSpeed * delta;
            const flap = Math.sin(this.wingFlapAngle) * 0.5;
            this.leftWing.rotation.z = flap;
            this.rightWing.rotation.z = -flap;

            return; // Skip landing attempts during cooldown
        }

        if (this.isLanded) {
            // If landed, decrement the landing timer
            this.landingTimer -= delta;
            if (this.landingTimer <= 0) {
                this.isLanded = false; // Start taking off
                this.isTakingOff = true;
                this.landingTarget = null; // Clear the landing target to allow a new random tree
            }
            return; // Skip movement while landed
        }

        if (this.isTakingOff) {
            // Fly up slowly and return to the circle
            const targetY = 10; // Height to reach after taking off
            const targetX = this.radius * Math.cos(this.angle); // Target X position in the circle
            const targetZ = this.radius * Math.sin(this.angle); // Target Z position in the circle

            const dx = targetX - obj.position.x;
            const dy = targetY - obj.position.y;
            const dz = targetZ - obj.position.z;

            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < 0.1) {
                // Reached flying height and position in the circle
                obj.position.set(targetX, targetY, targetZ);
                this.isTakingOff = false; // Resume normal flight
                this.cooldownTimer = 10000; // Set cooldown period (10 seconds)
            } else {
                // Move towards the target position in the circle
                obj.position.x += (dx / distance) * this.speed * delta * 20;
                obj.position.y += (dy / distance) * this.speed * delta * 20;
                obj.position.z += (dz / distance) * this.speed * delta * 20;

                // Update orientation
                this.updateOrientation(obj, dx, dy, dz);

                // Resume wing flapping during takeoff
                this.wingFlapAngle += this.wingFlapSpeed * delta;
                const flap = Math.sin(this.wingFlapAngle) * 0.5;
                this.leftWing.rotation.z = flap;
                this.rightWing.rotation.z = -flap;
            }
            return;
        }

        if (this.landingTarget) {
            // Fly down to the tree
            const targetX = this.landingTarget.objects[0].position.x;
            const targetZ = this.landingTarget.objects[0].position.z;
            const targetY = 2; // Height of the tree

            const dx = targetX - obj.position.x;
            const dz = targetZ - obj.position.z;
            const dy = targetY - obj.position.y;

            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < 0.1) {
                // Landed on the tree
                obj.position.set(targetX, targetY, targetZ);
                this.isLanded = true;
                this.landingTimer = 4000; // Stay landed for 3 seconds
            } else {
                // Move towards the tree
                obj.position.x += (dx / distance) * this.speed * delta * 10; // Slow descent
                obj.position.y += (dy / distance) * this.speed * delta * 10;
                obj.position.z += (dz / distance) * this.speed * delta * 10;

                // Update orientation
                this.updateOrientation(obj, dx, dy, dz);

                // Resume wing flapping during descent
                this.wingFlapAngle += this.wingFlapSpeed * delta;
                const flap = Math.sin(this.wingFlapAngle) * 0.5;
                this.leftWing.rotation.z = flap;
                this.rightWing.rotation.z = -flap;
            }
            return;
        }

        // Circle around the trees
        this.angle += this.speed * delta;
        obj.position.x = this.radius * Math.cos(this.angle);
        obj.position.z = this.radius * Math.sin(this.angle);
        obj.position.y = 10 + Math.sin(this.angle * 2); // Add some vertical motion

        // Update orientation
        this.updateOrientation(obj, -Math.sin(this.angle), 0, Math.cos(this.angle));

        // Flap wings
        this.wingFlapAngle += this.wingFlapSpeed * delta;
        const flap = Math.sin(this.wingFlapAngle) * 0.5;
        this.leftWing.rotation.z = flap;
        this.rightWing.rotation.z = -flap;

        // Occasionally decide to land on a tree
        if (Math.random() < 0.002) {
            const trees = this.world.objects.filter(obj => obj instanceof GrObject && obj.name === "AppleTree");
            if (trees.length > 0) {
                // Choose a random tree from the list
                const randomIndex = Math.floor(Math.random() * trees.length);
                this.landingTarget = trees[randomIndex];
            }
        }
    }

    updateOrientation(obj, dx, dy, dz) {
        const horizontalAngle = Math.atan2(dx, dz);
        obj.rotation.y = horizontalAngle;

        const tiltAngle = Math.atan2(-dy, Math.sqrt(dx * dx + dz * dz));
        obj.rotation.x = tiltAngle * 0.5; // Slight tilt toward the ground
    }
}
