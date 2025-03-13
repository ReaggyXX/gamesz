# Apate Battle Royale

A lightweight 3D battle royale game built with Three.js and Node.js. This prototype features third-person gameplay with movement, shooting, and a shrinking play area.

## Features

- 3D third-person gameplay with WASD/arrow key movement
- Third-person camera with over-the-shoulder aiming when right-clicking
- Hitscan shooting system with left-click
- Up to 10 players in a match
- Shrinking play area that damages players outside the boundary
- Simple environment with obstacles
- Real-time multiplayer using Socket.IO

## Project Structure

```
apate/
├── client/               # Client-side code
│   ├── js/              
│   │   ├── main.js           # Main entry point
│   │   ├── renderer.js       # Three.js scene management
│   │   ├── player-controller.js  # Player input and movement
│   │   ├── network-client.js # Socket.IO client
│   │   └── ui.js            # UI elements
│   └── index.html           # Main HTML page
├── server/               # Server-side code
│   ├── index.js             # Server entry point
│   ├── game-server.js       # Game state management
│   ├── player.js            # Player class
│   └── world.js             # World and boundary management
├── shared/               # Shared code (empty for now)
├── package.json          # Node.js dependencies
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Git

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/apate.git
   cd apate
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment to Render.com

### Set Up Git Repository

1. Create a repository on GitHub/GitLab/Bitbucket.
2. Push your code to the repository:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/apate.git
   git push -u origin main
   ```

### Deploy on Render.com

1. Sign up for a Render.com account if you don't have one.
2. From the Render dashboard, click on "New" and select "Web Service".
3. Connect your Git repository.
4. Configure the web service:
   - **Name**: apate-battle-royale
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or select appropriate plan)
   
5. Click "Create Web Service".
6. Your application will be deployed to a URL like `https://apate-battle-royale.onrender.com`.

## Controls

- **W/A/S/D or Arrow Keys**: Move
- **Mouse**: Look around
- **Right Mouse Button**: Aim
- **Left Mouse Button**: Shoot (while aiming)
- **Space**: Jump

## Game Rules

- Last player standing wins
- Staying outside the play area damages players
- The play area shrinks over time

## License

MIT

## Acknowledgments

This game builds on the foundation of a 3D third-person web game environment previously developed with Three.js, featuring character movement, third-person camera controls, and shooter mechanics.
