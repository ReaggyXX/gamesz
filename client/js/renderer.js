class Renderer {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
    
        // Store objects and players
        this.objects = [];
        this.players = {};

        // Setup lighting
        this.setupLights();
        
        // Setup ground
        this.setupGround();

        // Setup boundary visualization
        this.boundary = this.createBoundary(100); // Initial boundary size
        this.scene.add(this.boundary);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
     
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }
    
    createBoundary(radius) {
        const segments = 64;
        const material = new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 3 });
        const geometry = new THREE.BufferGeometry();
        
        const vertices = [];
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            vertices.push(radius * Math.cos(theta), 0, radius * Math.sin(theta));
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return new THREE.Line(geometry, material);
    }
    
    updateBoundary(radius) {
        this.scene.remove(this.boundary);
        this.boundary = this.createBoundary(radius);
        this.scene.add(this.boundary);
    }
    
    createPlayerModel(id, color = 0xff0000) {
        // Create a simple player model (a capsule)
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        group.add(body);
        
        // Head (optional detail)
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2;
        head.castShadow = true;
        group.add(head);
        
        this.scene.add(group);
        this.players[id] = group;
        
        return group;
    }
    
    removePlayer(id) {
        if (this.players[id]) {
            this.scene.remove(this.players[id]);
            delete this.players[id];
        }
    }
    
    updatePlayer(id, position, rotation) {
        if (!this.players[id]) {
            return;
        }
        
        this.players[id].position.copy(position);
        this.players[id].rotation.y = rotation;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        this.renderer.render(this.scene, this.camera);
    }
}
