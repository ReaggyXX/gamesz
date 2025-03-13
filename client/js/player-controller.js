class PlayerController {
    constructor(renderer) {
        this.renderer = renderer;
        this.camera = renderer.camera;
        this.player = null;
        this.playerId = null;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isJumping = false;
        this.isZooming = false;
        
        // Player stats
        this.health = 100;
        this.speed = 0.15;
        this.turnSpeed = 0.02;
        
        // Camera settings
        this.cameraDistance = 5;
        this.cameraHeight = 2;
        this.defaultDistance = 5;
        this.zoomDistance = 2;
        this.cameraSmoothness = 0.1;
        
        // Mouse control
        this.mouseX = 0;
        this.targetRotation = 0;
        
        // Crosshair
        this.crosshair = document.getElementById('crosshair');
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    init(id) {
        this.playerId = id;
        
        // Create player model
        const playerColor = Math.random() * 0xffffff;
        this.player = this.renderer.createPlayerModel(id, playerColor);
        
        // Setup camera initial position
        this.updateCamera();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Mouse controls
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
        document.addEventListener('mouseup', (event) => this.onMouseUp(event));
        
        // Lock pointer for better FPS controls
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
            case 'Space':
                if (!this.isJumping) {
                    this.isJumping = true;
                    this.jump();
                }
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;
        }
    }
    
    onMouseMove(event) {
        if (document.pointerLockElement === document.body) {
            // Update mouse position for camera rotation
            this.mouseX += event.movementX * this.turnSpeed;
            this.targetRotation = this.mouseX;
        }
    }
    
    onMouseDown(event) {
        // Right click to zoom
        if (event.button === 2) {
            event.preventDefault();
            this.isZooming = true;
            this.cameraDistance = this.zoomDistance;
            this.crosshair.style.opacity = '1';
        }
        
        // Left click to shoot
        if (event.button === 0 && this.isZooming) {
            this.shoot();
        }
    }
    
    onMouseUp(event) {
        // End zoom
        if (event.button === 2) {
            this.isZooming = false;
            this.cameraDistance = this.defaultDistance;
            this.crosshair.style.opacity = '0';
        }
    }
    
    shoot() {
        if (!this.player) return;
        
        // Create a ray from the camera
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Dispatch shoot event to the network
        if (window.networkClient) {
            window.networkClient.shoot(raycaster.ray.direction);
        }
        
        // Visual feedback for shooting
        this.createMuzzleFlash();
    }
    
    createMuzzleFlash() {
        // A simple visual effect for shooting
        if (!this.player) return;
        
        const flash = new THREE.PointLight(0xffff00, 1, 10);
        flash.position.set(0, 1.5, 0);
        this.player.add(flash);
        
        // Remove after a short time
        setTimeout(() => {
            this.player.remove(flash);
        }, 50);
    }
    
    jump() {
        if (!this.player) return;
        
        // Simple jump animation
        const startY = this.player.position.y;
        const jumpHeight = 2;
        const jumpDuration = 500; // ms
        
        const startTime = Date.now();
        
        const animateJump = () => {
            const elapsedTime = Date.now() - startTime;
            const jumpProgress = Math.min(elapsedTime / jumpDuration, 1);
            
            // Simple parabolic jump
            const height = startY + jumpHeight * Math.sin(jumpProgress * Math.PI);
            this.player.position.y = height;
            
            if (jumpProgress < 1) {
                requestAnimationFrame(animateJump);
            } else {
                this.player.position.y = startY;
                this.isJumping = false;
            }
        };
        
        animateJump();
    }
    
    updateRotation() {
        if (!this.player) return;
        
        // Smoothly rotate player to face movement direction
        this.player.rotation.y = this.targetRotation;
    }
    
    updateMovement() {
        if (!this.player) return;
        
        // Calculate movement based on input and rotation
        let moveX = 0;
        let moveZ = 0;
        
        if (this.moveForward) moveZ -= this.speed;
        if (this.moveBackward) moveZ += this.speed;
        if (this.moveLeft) moveX -= this.speed;
        if (this.moveRight) moveX += this.speed;
        
        // Apply rotation to movement
        if (moveX !== 0 || moveZ !== 0) {
            const angle = this.player.rotation.y;
            const newMoveX = moveX * Math.cos(angle) + moveZ * Math.sin(angle);
            const newMoveZ = moveZ * Math.cos(angle) - moveX * Math.sin(angle);
            
            moveX = newMoveX;
            moveZ = newMoveZ;
            
            // Collision detection with obstacles
            const nextPosition = new THREE.Vector3(
                this.player.position.x + moveX,
                this.player.position.y,
                this.player.position.z + moveZ
            );
            
            if (!this.checkCollision(nextPosition)) {
                this.player.position.x += moveX;
                this.player.position.z += moveZ;
                
                // Dispatch position update to the network
                if (window.networkClient) {
                    window.networkClient.updatePosition(this.player.position, this.player.rotation.y);
                }
            }
        }
    }
    
    checkCollision(position) {
        // Simple collision detection with obstacles
        for (const object of this.renderer.objects) {
            if (object.geometry && position.distanceTo(object.position) < 1.5) {
                return true;
            }
        }
        
        return false;
    }
    
    updateCamera() {
        if (!this.player) return;
        
        // Calculate camera position based on player position and rotation
        const targetPosition = new THREE.Vector3();
        const playerPosition = this.player.position.clone();
        
        // Position behind player at specified distance and height
        const angle = this.player.rotation.y;
        targetPosition.x = playerPosition.x - this.cameraDistance * Math.sin(angle);
        targetPosition.y = playerPosition.y + this.cameraHeight;
        targetPosition.z = playerPosition.z - this.cameraDistance * Math.cos(angle);
        
        // Smoothly interpolate camera position
        this.camera.position.lerp(targetPosition, this.cameraSmoothness);
        
        // Look at player
        this.camera.lookAt(
            playerPosition.x,
            playerPosition.y + 1.5, // Look at head level
            playerPosition.z
        );
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Update UI health bar
        if (window.ui) {
            window.ui.updateHealth(this.health);
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        // Handle player death
        if (window.networkClient) {
            window.networkClient.playerDied();
        }
    }
    
    respawn(position) {
        this.health = 100;
        this.player.position.copy(position);
        
        // Update UI
        if (window.ui) {
            window.ui.updateHealth(this.health);
        }
    }
    
    update() {
        this.updateRotation();
        this.updateMovement();
        this.updateCamera();
    }
}
