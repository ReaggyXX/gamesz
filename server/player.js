class Player {
    constructor(id, position) {
        this.id = id;
        this.position = position;
        this.rotation = 0;
        this.health = 100;
        this.isDead = false;
    }
    
    reset(position) {
        this.position = position;
        this.health = 100;
        this.isDead = false;
    }
}

module.exports = Player;
