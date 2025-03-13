class World {
    constructor() {
        // Boundary settings
        this.initialBoundaryRadius = 100;
        this.finalBoundaryRadius = 20;
        this.boundaryRadius = this.initialBoundaryRadius;
        
        // Map size (used for spawn positions)
        this.mapSize = 180; // Slightly smaller than initial boundary
    }
    
    getRandomSpawnPosition() {
        // Generate random spawn position within a safe radius
        const safeRadius = this.boundaryRadius * 0.8; // Stay away from the boundary
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * safeRadius;
        
        return {
            x: Math.cos(angle) * distance,
            y: 0, // Ground level
            z: Math.sin(angle) * distance
        };
    }
    
    resetBoundary() {
        this.boundaryRadius = this.initialBoundaryRadius;
    }
    
    shrinkBoundary(progress) {
        // Linear interpolation between initial and final radius
        this.boundaryRadius = this.initialBoundaryRadius - 
            (this.initialBoundaryRadius - this.finalBoundaryRadius) * progress;
    }
}

module.exports = World;
