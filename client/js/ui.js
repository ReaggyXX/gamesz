class UI {
    constructor() {
        this.healthBar = document.getElementById('health-fill');
        this.playersAlive = document.getElementById('players-alive');
        this.crosshair = document.getElementById('crosshair');
        
        // References to UI elements that will be created dynamically
        this.gameOverScreen = null;
    }
    
    updateHealth(health) {
        // Update health bar width
        const percentage = Math.max(0, Math.min(100, health));
        this.healthBar.style.width = percentage + '%';
        
        // Update color based on health
        if (percentage > 60) {
            this.healthBar.style.backgroundColor = '#0f0'; // Green
        } else if (percentage > 30) {
            this.healthBar.style.backgroundColor = '#ff0'; // Yellow
        } else {
            this.healthBar.style.backgroundColor = '#f00'; // Red
        }
    }
    
    updatePlayerCount(count) {
        this.playersAlive.textContent = `Players: ${count}/10`;
    }
    
    showGameOver(isWinner) {
        // Create game over screen if it doesn't exist
        if (!this.gameOverScreen) {
            this.gameOverScreen = document.createElement('div');
            this.gameOverScreen.style.position = 'absolute';
            this.gameOverScreen.style.top = '50%';
            this.gameOverScreen.style.left = '50%';
            this.gameOverScreen.style.transform = 'translate(-50%, -50%)';
            this.gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.gameOverScreen.style.padding = '20px';
            this.gameOverScreen.style.borderRadius = '10px';
            this.gameOverScreen.style.color = 'white';
            this.gameOverScreen.style.textAlign = 'center';
            this.gameOverScreen.style.fontFamily = 'Arial, sans-serif';
            document.body.appendChild(this.gameOverScreen);
        }
        
        // Set game over message
        if (isWinner) {
            this.gameOverScreen.innerHTML = `
                <h2 style="color: gold;">VICTORY ROYALE!</h2>
                <p>You are the last one standing</p>
                <button id="restart-btn" style="
                    background-color: #0088ff;
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 16px;
                    margin: 4px 2px;
                    cursor: pointer;
                    border-radius: 5px;
                ">Play Again</button>
            `;
        } else {
            this.gameOverScreen.innerHTML = `
                <h2 style="color: #ff3333;">GAME OVER</h2>
                <p>Better luck next time!</p>
                <button id="restart-btn" style="
                    background-color: #0088ff;
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 16px;
                    margin: 4px 2px;
                    cursor: pointer;
                    border-radius: 5px;
                ">Play Again</button>
            `;
        }
        
        // Add restart button handler
        document.getElementById('restart-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }
    
    hideGameOver() {
        if (this.gameOverScreen) {
            document.body.removeChild(this.gameOverScreen);
            this.gameOverScreen = null;
        }
    }
}
