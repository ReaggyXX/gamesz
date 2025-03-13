class NetworkClient {
    constructor(renderer, playerController, ui) {
        this.renderer = renderer;
        this.playerController = playerController;
        this.ui = ui;
        this.socket = null;
        this.players = {};
        this.playerId = null;
        this.isConnected = false;
        
        // Throttle variables for position updates
        this.lastUpdateTime = 0;
        this.updateInterval = 50; // ms, 20 updates per second
    }
    
    connect(serverUrl) {
        // Connect to the Socket.IO server
        this.socket = io(serverUrl);
        
        // Setup event listeners
        this.setupSocketListeners();
    }
    
    setupSocketListeners() {
        // Connection established
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.socket.emit('join_game');
        });
        
        // Disconnection
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            
            // Handle reconnection logic if needed
        });
        
        // Player ID assignment
        this.socket.on('player_id', (id) => {
            console.log('Received player ID:', id);
            this.playerId = id;
            
            // Initialize the player controller with this ID
            this.playerController.init(id);
        });
        
        // New player joined
        this.socket.on('player_joined', (data) => {
            console.log('Player joined:', data.id);
            
            // Don't create a model for our own player
            if (data.id !== this.playerId) {
                this.renderer.createPlayerModel(data.id);
            }
            
            // Update player count
            this.ui.updatePlayerCount(data.count);
        });
        
        // Player left
        this.socket.on('player_left', (data) => {
            console.log('Player left:', data.id);
            
            // Remove the player model
            this.renderer.removePlayer(data.id);
            
            // Update player count
            this.ui.updatePlayerCount(data.count);
        });
        
        // Player position update
        this.socket.on('player_position', (data) => {
            // Skip updates for our own player
            if (data.id === this.playerId) return;
            
            // Update the player's position in the renderer
            const position = new THREE.Vector3(data.x, data.y, data.z);
            this.renderer.updatePlayer(data.id, position, data.rotation);
        });
        
        // Player hit (got shot)
        this.socket.on('player_hit', (data) => {
            if (data.id === this.playerId) {
                // We got hit
                this.playerController.takeDamage(data.damage);
            }
        });
        
        // Game state update
        this.socket.on('game_state', (data) => {
            // Update boundary
            if (data.boundaryRadius) {
                this.renderer.updateBoundary(data.boundaryRadius);
            }
            
            // Update player count
            this.ui.updatePlayerCount(data.playerCount);
        });
        
        // Game over
        this.socket.on('game_over', (data) => {
            this.ui.showGameOver(data.winnerId === this.playerId);
        });
    }
    
    updatePosition(position, rotation) {
        // Throttle updates to reduce network traffic
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateInterval) return;
        
        this.lastUpdateTime = now;
        
        if (!this.isConnected) return;
        
        // Send position update to server
        this.socket.emit('position', {
            x: position.x,
            y: position.y,
            z: position.z,
            rotation: rotation
        });
    }
    
    shoot(direction) {
        if (!this.isConnected) return;
        
        // Send shoot command to server
        this.socket.emit('shoot', {
            dirX: direction.x,
            dirY: direction.y,
            dirZ: direction.z
        });
    }
    
    playerDied() {
        if (!this.isConnected) return;
        
        // Inform server that player died
        this.socket.emit('player_died');
    }
}
