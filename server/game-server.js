const Player = require('./player');
const World = require('./world');

class GameServer {
    constructor(io) {
        this.io = io;
        this.players = {};
        this.world = new World();
        
        // Game settings
        this.maxPlayers = 10;
        this.minPlayersToStart = 2;
        this.damagePerShot = 20;
        
        // Game state
        this.gameState = 'waiting'; // waiting, active, ended
        this.gameStartTime = null;
        this.gameDuration = 300000; // 5 minutes in ms
        this.gameInterval = null;
        
        // Setup socket handlers
        this.setupSocketHandlers();
        
        // Start game loop
        this.startGameLoop();
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`New connection: ${socket.id}`);
            
            // Player joins the game
            socket.on('join_game', () => {
                this.addPlayer(socket);
            });
            
            // Player position update
            socket.on('position', (data) => {
                this.updatePlayerPosition(socket.id, data);
            });
            
            // Player shoots
            socket.on('shoot', (data) => {
                this.handleShoot(socket.id, data);
            });
            
            // Player died
            socket.on('player_died', () => {
                this.handlePlayerDeath(socket.id);
            });
            
            // Player disconnects
            socket.on('disconnect', () => {
                this.removePlayer(socket.id);
            });
        });
    }
    
    addPlayer(socket) {
        // Check if game is full
        if (Object.keys(this.players).length >= this.maxPlayers) {
            socket.emit('game_full');
            return;
        }
        
        // Create spawn position
        const spawnPosition = this.world.getRandomSpawnPosition();
        
        // Create new player
        const player = new Player(socket.id, spawnPosition);
        this.players[socket.id] = player;
        
        // Send player ID to client
        socket.emit('player_id', socket.id);
        
        // Notify all clients about new player
        this.io.emit('player_joined', {
            id: socket.id,
            count: Object.keys(this.players).length
        });
        
        // Send current game state to the new player
        socket.emit('game_state', {
            boundaryRadius: this.world.boundaryRadius,
            playerCount: Object.keys(this.players).length
        });
        
        // Send existing players' positions to the new player
        for (const playerId in this.players) {
            if (playerId !== socket.id) {
                const existingPlayer = this.players[playerId];
                socket.emit('player_position', {
                    id: playerId,
                    x: existingPlayer.position.x,
                    y: existingPlayer.position.y,
                    z: existingPlayer.position.z,
                    rotation: existingPlayer.rotation
                });
            }
        }
        
        // Check if we have enough players to start the game
        this.checkGameStart();
    }
    
    removePlayer(playerId) {
        if (this.players[playerId]) {
            delete this.players[playerId];
            
            // Notify all clients about player leaving
            this.io.emit('player_left', {
                id: playerId,
                count: Object.keys(this.players).length
            });
            
            // Check if game should end
            this.checkGameEnd();
        }
    }
    
    updatePlayerPosition(playerId, data) {
        if (!this.players[playerId]) return;
        
        // Update player position
        const player = this.players[playerId];
        player.position.x = data.x;
        player.position.y = data.y;
        player.position.z = data.z;
        player.rotation = data.rotation;
        
        // Broadcast position update to all other clients
        this.io.emit('player_position', {
            id: playerId,
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
            rotation: player.rotation
        });
        
        // Check if player is outside the boundary
        if (this.gameState === 'active') {
            const distanceFromCenter = Math.sqrt(
                player.position.x * player.position.x + 
                player.position.z * player.position.z
            );
            
            if (distanceFromCenter > this.world.boundaryRadius) {
                // Apply damage to player for being outside boundary
                player.health -= 1; // 1 damage per tick
                
                // Check if player died
                if (player.health <= 0 && !player.isDead) {
                    player.isDead = true;
                    this.handlePlayerDeath(playerId);
                }
                
                // Notify client about damage
                this.io.to(playerId).emit('player_hit', {
                    id: playerId,
                    damage: 1
                });
            }
        }
    }
    
    handleShoot(playerId, data) {
        if (!this.players[playerId] || this.gameState !== 'active') return;
        
        const shooter = this.players[playerId];
        
        // Create a ray from the shooter's position in the direction provided
        const rayStart = shooter.position;
        const rayDirection = {
            x: data.dirX,
            y: data.dirY,
            z: data.dirZ
        };
        
        // Normalize direction
        const length = Math.sqrt(
            rayDirection.x * rayDirection.x + 
            rayDirection.y * rayDirection.y + 
            rayDirection.z * rayDirection.z
        );
        
        rayDirection.x /= length;
        rayDirection.y /= length;
        rayDirection.z /= length;
        
        // Check for hits against other players
        for (const targetId in this.players) {
            // Skip the shooter
            if (targetId === playerId) continue;
            
            const target = this.players[targetId];
            
            // Skip dead players
            if (target.isDead) continue;
            
            // Simple distance-based hit detection
            // (In a real game, you'd use more sophisticated collision detection)
            const targetPos = target.position;
            
            // Calculate a point along the ray
            // For simplicity, we'll check a few points along the ray
            for (let t = 0; t < 100; t++) {
                const pointX = rayStart.x + rayDirection.x * t;
                const pointY = rayStart.y + rayDirection.y * t;
                const pointZ = rayStart.z + rayDirection.z * t;
                
                // Distance from point to target
                const dx = pointX - targetPos.x;
                const dy = pointY - targetPos.y;
                const dz = pointZ - targetPos.z;
                const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (distance < 1.0) { // Hit threshold (player radius)
                    // Target hit!
                    target.health -= this.damagePerShot;
                    
                    // Notify the target that they got hit
                    this.io.to(targetId).emit('player_hit', {
                        id: targetId,
                        damage: this.damagePerShot
                    });
                    
                    // Check if target died
                    if (target.health <= 0 && !target.isDead) {
                        target.isDead = true;
                        this.handlePlayerDeath(targetId);
                    }
                    
                    // Only count the first hit
                    break;
                }
            }
        }
    }
    
    handlePlayerDeath(playerId) {
        if (!this.players[playerId]) return;
        
        const player = this.players[playerId];
        player.isDead = true;
        
        // Notify all clients about player death
        this.io.emit('player_died', {
            id: playerId
        });
        
        // Check if game should end
        this.checkGameEnd();
    }
    
    checkGameStart() {
        if (this.gameState === 'waiting' && 
            Object.keys(this.players).length >= this.minPlayersToStart) {
            this.startGame();
        }
    }
    
    startGame() {
        this.gameState = 'active';
        this.gameStartTime = Date.now();
        
        // Reset boundary
        this.world.resetBoundary();
        
        // Start boundary shrinking
        this.startBoundaryShrink();
        
        // Notify all clients that the game has started
        this.io.emit('game_start');
        
        console.log('Game started');
    }
    
    checkGameEnd() {
        // Count alive players
        let alivePlayers = 0;
        let lastAlivePlayer = null;
        
        for (const playerId in this.players) {
            if (!this.players[playerId].isDead) {
                alivePlayers++;
                lastAlivePlayer = playerId;
            }
        }
        
        // If only one player left, they win
        if (this.gameState === 'active' && alivePlayers <= 1 && lastAlivePlayer) {
            this.endGame(lastAlivePlayer);
        }
        
        // If no players left, end the game with no winner
        if (alivePlayers === 0) {
            this.endGame(null);
        }
    }
    
    endGame(winnerId) {
        this.gameState = 'ended';
        
        // Stop boundary shrinking
        clearInterval(this.gameInterval);
        
        // Notify all clients about game over
        this.io.emit('game_over', {
            winnerId: winnerId
        });
        
        console.log('Game ended, winner:', winnerId);
        
        // Reset game after a delay
        setTimeout(() => {
            this.resetGame();
        }, 10000); // 10 seconds
    }
    
    resetGame() {
        // Reset all players
        for (const playerId in this.players) {
            const player = this.players[playerId];
            player.reset(this.world.getRandomSpawnPosition());
        }
        
        // Reset world
        this.world.resetBoundary();
        
        // Reset game state
        this.gameState = 'waiting';
        this.gameStartTime = null;
        
        // Notify all clients about game reset
        this.io.emit('game_reset');
        
        // Check if we can start a new game
        this.checkGameStart();
        
        console.log('Game reset');
    }
    
    startBoundaryShrink() {
        // Clear existing interval if any
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }
        
        // Set shrink interval
        this.gameInterval = setInterval(() => {
            // Calculate elapsed time
            const elapsedTime = Date.now() - this.gameStartTime;
            
            // Calculate shrink progress (0 to 1)
            const shrinkProgress = Math.min(elapsedTime / this.gameDuration, 1);
            
            // Shrink boundary
            this.world.shrinkBoundary(shrinkProgress);
            
            // Broadcast boundary update
            this.io.emit('game_state', {
                boundaryRadius: this.world.boundaryRadius,
                playerCount: Object.keys(this.players).filter(id => !this.players[id].isDead).length
            });
            
            // End game when time is up
            if (shrinkProgress >= 1) {
                this.checkGameEnd();
            }
        }, 1000); // Update every second
    }
    
    startGameLoop() {
        // Primary game loop
        setInterval(() => {
            // This could be used for additional game logic that needs to run periodically
            // For now, we're handling most logic through events
        }, 100); // 10 times per second
    }
}

module.exports = GameServer;
