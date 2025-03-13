// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Prevent context menu on right-click (used for zooming)
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
    
    // Initialize renderer
    window.renderer = new Renderer();
    
    // Initialize UI
    window.ui = new UI();
    
    // Initialize player controller
    window.playerController = new PlayerController(window.renderer);
    
    // Initialize network client
    // Note: In development, connect to localhost, but in production use the deployed server
    const serverUrl = location.hostname === 'localhost' || location.hostname === '127.0.0.1' 
        ? `http://${location.hostname}:3000` 
        : 'https://apate-battle-royale.onrender.com';
    
    window.networkClient = new NetworkClient(window.renderer, window.playerController, window.ui);
    window.networkClient.connect(serverUrl);
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Update player controller
        if (window.playerController) {
            window.playerController.update();
        }
        
        // Update renderer
        if (window.renderer) {
            window.renderer.update();
        }
    }
    
    // Start animation loop
    animate();
});
