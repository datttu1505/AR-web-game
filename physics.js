// Physics engine for AR game
class PhysicsEngine {
    constructor() {
        // Setup physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Earth gravity
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Bodies in the simulation
        this.bodies = [];
        this.meshes = [];
        
        // Spring properties
        this.springConstant = 10; // k value
        this.springRestLength = 0.2;
        this.currentCompression = 0;
    }
    
    // Initialize the physics scene
    init() {
        // Create a ground plane for objects to land on
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 }); // mass 0 makes it static
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // rotate to be flat
        groundBody.position.set(0, -0.1, 0); // Move ground slightly below the base
        this.world.addBody(groundBody);
        
        // Add base for the spring
        const baseShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.05, 0.25));
        const baseBody = new CANNON.Body({ mass: 0 });
        baseBody.addShape(baseShape);
        baseBody.position.set(0, 0, 0);
        this.world.addBody(baseBody);
        this.springBase = baseBody;
    }
    
    // Set spring constant (k)
    setSpringConstant(k) {
        this.springConstant = k;
    }
    
    // Compress the spring - returns current compression amount
    compressSpring(amount) {
        this.currentCompression = Math.min(amount, 0.5); // Limit compression
        return this.currentCompression;
    }
    
    // Launch a projectile using the spring
    launchProjectile(angle) {
        const radius = 0.1;
        const projectileShape = new CANNON.Sphere(radius);
        const mass = 0.5; // Keep the mass consistent
        
        // Calculate force based on k and compression
        const force = this.springConstant * this.currentCompression; // F = kx
        const initialVelocity = Math.sqrt((2 * force) / mass); // v = sqrt(2F/m)
        
        // Adjust projectile starting position based on compression
        const startHeight = 0.2 - this.currentCompression;
    
        // Create the projectile body
        const projectileBody = new CANNON.Body({
            mass: mass,
            shape: projectileShape,
            position: new CANNON.Vec3(0, startHeight, 0),
            linearDamping: 0.1
        });
    
        // Convert angle to radians
        const radians = angle * Math.PI / 180;
    
        // Apply the force as an impulse
        const forceVector = new CANNON.Vec3(
            Math.cos(radians) * initialVelocity, // X Direction
            Math.sin(radians) * initialVelocity, // Y (height)
            0 // If needed, modify for 3D motion
        );
        
        projectileBody.applyImpulse(forceVector, new CANNON.Vec3(0, 0, 0));
        
        // Add to physics world
        this.world.addBody(projectileBody);
        this.bodies.push(projectileBody);
    
        console.log('Projectile launched:', {
            position: projectileBody.position,
            velocity: projectileBody.velocity,
            force: forceVector
        });
    
        return {
            body: projectileBody,
            launchForce: force,
            trajectory: []
        };
    }
    
    
    // Update physics simulation
    update(deltaTime) {
        this.world.step(deltaTime);
        
        // Update trajectories and check collisions here
        this.bodies.forEach(body => {
            if (body.position.y < -2) {
                // Remove bodies that fall below the scene
                this.world.removeBody(body);
                const index = this.bodies.indexOf(body);
                if (index > -1) {
                    this.bodies.splice(index, 1);
                }
            }
        });
        
        return this.bodies.map(body => {
            return {
                position: body.position,
                velocity: body.velocity
            };
        });
    }
    
    // Calculate theoretical trajectory based on physics formulas
    calculateTheoreticalTrajectory(angle, initialVelocity) {
        const trajectoryPoints = [];
        const g = 9.82; // gravity in m/s²
        const radians = angle * Math.PI / 180;
        const v0x = initialVelocity * Math.cos(radians); // Changed to match launch calculation
        const v0y = initialVelocity * Math.sin(radians); // Changed to match launch calculation
        
        // Calculate time of flight
        const timeOfFlight = (2 * v0y) / g;
        
        // Generate points along trajectory
        for (let t = 0; t <= timeOfFlight; t += 0.1) {
            const x = v0x * t;
            const y = v0y * t - 0.5 * g * t * t;
            
            // Stop if we hit the ground
            if (y < 0) break;
            
            trajectoryPoints.push({ x, y });
        }
        
        return trajectoryPoints;
    }
}
