// Main game controller for AR Physics Game
window.addEventListener('DOMContentLoaded', () => {
    // Setup UI controls
    const springConstantSlider = document.getElementById('spring-constant');
    const kValueDisplay = document.getElementById('k-value');
    const launchButton = document.getElementById('launch-button');
    const angleSlider = document.getElementById('launch-angle');
    const angleDisplay = document.getElementById('angle-value');
    const rotationSlider = document.getElementById('launch-rotation');
    const rotationDisplay = document.getElementById('rotation-value');
    
    // Game state
    let gameState = {
        springAngle: 45, // Default launch angle
        rotationAngle: 0, // Default rotation angle
        isAiming: false,
        projectiles: [],
        targets: [],
        score: 0,
        tries: 0
    };
    
    // Create physics engine
    const physics = new PhysicsEngine();
    physics.init();
    
    // Setup A-Frame components
    setupARComponents();
    
    // Update score display
    function updateScoreDisplay() {
        document.getElementById('current-score').textContent = gameState.score;
        document.getElementById('current-tries').textContent = gameState.tries;
    }
    
    // Update k value display when slider changes
    springConstantSlider.addEventListener('input', (e) => {
        const kValue = parseInt(e.target.value);
        kValueDisplay.textContent = kValue;
        physics.setSpringConstant(kValue);
    });
    
    // Update angle value display when slider changes
    angleSlider.addEventListener('input', (e) => {
        const angleValue = parseInt(e.target.value);
        angleDisplay.textContent = angleValue;
        gameState.springAngle = angleValue;
    });

    // Update rotation value display when slider changes
    rotationSlider.addEventListener('input', (e) => {
        const rotationValue = parseInt(e.target.value);
        rotationDisplay.textContent = rotationValue;
        gameState.rotationAngle = rotationValue;
    });
    
    // Launch button handler
    launchButton.addEventListener('click', () => {
        gameState.tries++;
        updateScoreDisplay();
        launchProjectile();
    });
    
    // Handle touch events for aiming
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    // Main game loop
    let lastTime = 0;
    function gameLoop(timestamp) {
        // Calculate time difference
        if (!lastTime) lastTime = timestamp;
        const deltaTime = (timestamp - lastTime) / 1000; // Convert to seconds
        lastTime = timestamp;
        
        // Update physics
        updatePhysics(deltaTime);
        
        // Update visual elements
        updateVisuals();
        
        // Check for collisions with targets
        checkCollisions();
        
        // Request next frame
        requestAnimationFrame(gameLoop);
    }
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    // Update visuals based on current state
    function updateVisuals() {
        const barrelGroup = document.getElementById('barrel-group');
        if (barrelGroup) {
            // Apply both vertical and horizontal rotation
            const verticalAngle = 90 - gameState.springAngle; // Invert the angle so 0° is up and 90° is horizontal
            const horizontalAngle = gameState.rotationAngle + 90; // Remove negative sign to make it clockwise
            
            // Set the rotation (x for vertical, y for horizontal)
            // Now 0 degrees is straight up, 90 is horizontal, with 90 degree clockwise offset
            barrelGroup.setAttribute('rotation', `${verticalAngle} ${horizontalAngle} 0`);
        }
    }
    
    // Launch a projectile using current spring settings
    function launchProjectile() {
        // Get current spring values
        const k = physics.springConstant;
        const compression = physics.currentCompression || 0.3;
        
        // Calculate launch parameters
        const mass = 0.5;
        const springForce = k * compression;
        const initialVelocity = Math.sqrt((2 * springForce) / mass);
        
        // Convert angles to radians
        const launchAngle = gameState.springAngle;
        const rotationAngle = -gameState.rotationAngle; // Remove the 90-degree offset for velocity
        const launchRadians = launchAngle * (Math.PI / 180);
        const rotationRadians = rotationAngle * (Math.PI / 180);
        
        // Calculate velocity components with rotation
        // Now 0 degrees is horizontal, 90 is straight up
        const vx = initialVelocity * Math.cos(launchRadians) * Math.cos(rotationRadians);
        const vy = initialVelocity * Math.sin(launchRadians);
        const vz = initialVelocity * Math.cos(launchRadians) * Math.sin(rotationRadians);
        
        // Create projectile
        const radius = 0.1;
        const projectileShape = new CANNON.Sphere(radius);
        const projectileBody = new CANNON.Body({
            mass: mass,
            shape: projectileShape,
            position: new CANNON.Vec3(0, 0.5, 0), // Start at cannon tip
            linearDamping: 0.1
        });
        
        // Apply impulse with angle consideration
        projectileBody.velocity.set(vx, vy, vz);
        
        // Add to physics world
        physics.world.addBody(projectileBody);
        
        // Create visual representation in AR
        const projectileEntity = document.createElement('a-sphere');
        projectileEntity.setAttribute('radius', 0.1);
        projectileEntity.setAttribute('color', 'red');
        projectileEntity.setAttribute('position', '0 0.5 0'); // Start at cannon tip
        
        // Add to scene
        const marker = document.querySelector('a-marker');
        marker.appendChild(projectileEntity);
        
        // Add to game state with visual reference
        gameState.projectiles.push({
            physics: {
                body: projectileBody,
                launchForce: springForce,
                trajectory: []
            },
            visual: projectileEntity
        });
        
        // Predict and show trajectory
        const trajectory = physics.calculateTheoreticalTrajectory(launchAngle, initialVelocity);
        showTrajectory(trajectory);
        
        // Reset spring compression
        physics.compressSpring(0);
    }
    
    // Add an angle control to the UI
    function setupAngleControl() {
        // Create angle slider
        const angleContainer = document.createElement('div');
        angleContainer.innerHTML = `
            <label for="launch-angle">Launch Angle:</label>
            <input type="range" id="launch-angle" min="0" max="90" value="45">
            <span id="angle-value">45°</span>
        `;
        
        const uiContainer = document.getElementById('ui-container');
        uiContainer.insertBefore(angleContainer, uiContainer.lastChild);
        
        const angleSlider = document.getElementById('launch-angle');
        const angleDisplay = document.getElementById('angle-value');
        
        angleSlider.addEventListener('input', (e) => {
            const angle = parseInt(e.target.value);
            gameState.springAngle = angle;
            angleDisplay.textContent = `${angle}°`;
        });
    }
    
    
    // Update physics simulation
    function updatePhysics(deltaTime) {
        // Step the physics world
        physics.update(deltaTime);
        
        // Update all projectiles
        gameState.projectiles.forEach(projectile => {
            const pos = projectile.physics.body.position;
            
            // Update visual position
            projectile.visual.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
            
            // Record trajectory for visualization
            projectile.physics.trajectory.push({x: pos.x, y: pos.y, z: pos.z});
            
            // Remove projectiles that have fallen below the scene
            if (pos.y < -2) {
                // Remove from physics world
                physics.world.removeBody(projectile.physics.body);
                
                // Remove visual element
                projectile.visual.parentNode.removeChild(projectile.visual);
                
                // Remove from game state
                const index = gameState.projectiles.indexOf(projectile);
                if (index > -1) {
                    gameState.projectiles.splice(index, 1);
                }
            }
        });
    }
    
    // Check for collisions with targets
    function checkCollisions() {
        gameState.projectiles.forEach(projectile => {
            gameState.targets.forEach(target => {
                // Basic collision detection
                const projectilePos = projectile.physics.body.position;
                const targetPos = target.physics.body.position;
                const distance = Math.sqrt(
                    Math.pow(projectilePos.x - targetPos.x, 2) +
                    Math.pow(projectilePos.y - targetPos.y, 2) +
                    Math.pow(projectilePos.z - targetPos.z, 2)
                );
                
                const collisionThreshold = 0.2; // Sum of radii
                if (distance < collisionThreshold) {
                    // Handle collision
                    console.log("Hit target!");
                    gameState.score += 10;
                    
                    // Randomly generate new position
                    const newX = Math.random() * 2 - 1; // Random between -1 and 1
                    const newY = 0.1; // Keep at same height
                    const newZ = Math.random() * 2 - 1; // Random between -1 and 1
                    
                    // Update target's visual position
                    target.visual.setAttribute('position', `${newX} ${newY} ${newZ}`);
                    
                    // Update target's physics body position
                    target.physics.body.position.set(newX, newY, newZ);
                    
                    // Change target color to indicate hit
                    target.visual.setAttribute('color', 'green');
                    
                    // Optional: Briefly flash green then return to original color
                    setTimeout(() => {
                        target.visual.setAttribute('color', 'yellow');
                    }, 500);
                }
            });
        });
    }
    
    // Handle touch for spring compression
    function handleTouchStart(e) {
        gameState.isAiming = true;
        
        // Get initial touch position
        const touch = e.touches[0];
        gameState.touchStartY = touch.clientY;
    }
    
    function handleTouchMove(e) {
        if (!gameState.isAiming) return;
        
        const touch = e.touches[0];
        const deltaY = gameState.touchStartY - touch.clientY;
        
        // Map touch movement to spring compression
        const compression = Math.max(0, Math.min(0.5, deltaY / 300));
        physics.compressSpring(compression);
        
        // Update spring visualization
        updateVisuals();
    }
    
    function handleTouchEnd(e) {
        if (!gameState.isAiming) return;
        gameState.isAiming = false;
        
        // Could auto-launch here if desired
        // launchProjectile();
    }
    
    // Setup custom AR components for A-Frame
    function setupARComponents() {
        // Register components
        AFRAME.registerComponent('target', {
            init: function() {
                // Create a target
                const targetEntity = this.el;
                
                // Add to game state
                const targetObject = {
                    visual: targetEntity,
                    physics: {
                        body: {
                            position: new CANNON.Vec3(
                                parseFloat(targetEntity.getAttribute('position').x),
                                parseFloat(targetEntity.getAttribute('position').y),
                                parseFloat(targetEntity.getAttribute('position').z)
                            )
                        }
                    }
                };
                
                gameState.targets.push(targetObject);
            }
        });
        
        // Create some targets
        const marker = document.querySelector('a-marker');
        
        // Add target at some distance
        const target = document.createElement('a-sphere');
        target.setAttribute('radius', 0.1);
        target.setAttribute('color', 'yellow');
        target.setAttribute('position', '1 0.1 0');
        target.setAttribute('target', '');
        marker.appendChild(target);
    }
    
    // Visualize trajectory prediction
    function showTrajectory(trajectoryPoints) {
        // Remove old trajectory visualization
        const oldTrajectory = document.getElementById('trajectory');
        if (oldTrajectory) {
            oldTrajectory.parentNode.removeChild(oldTrajectory);
        }
        
        // Create line entity for trajectory
        const line = document.createElement('a-entity');
        line.id = 'trajectory';
        
        // Convert trajectory points to A-Frame line format
        let linePoints = '';
        trajectoryPoints.forEach(point => {
            linePoints += `${point.x} ${point.y} 0, `;
        });
        
        // Remove trailing comma
        linePoints = linePoints.slice(0, -2);
        
        // Set line attributes with proper scaling
        line.setAttribute('line', {
            start: '0 0.2 0',
            end: `${trajectoryPoints[trajectoryPoints.length-1].x} ${trajectoryPoints[trajectoryPoints.length-1].y} 0`,
            color: 'white',
            opacity: 0.8
        });
        
        // Add to marker
        const marker = document.querySelector('a-marker');
        marker.appendChild(line);
    }
});