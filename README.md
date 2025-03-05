# AR Physics Game

An augmented reality physics game built with A-Frame, AR.js, and Cannon.js. Players can launch projectiles at targets using a virtual cannon in AR.

## Features

- AR-based cannon that responds to user input
- Physics-based projectile launching
- Score tracking
- Multiple targets
- Trajectory prediction
- Touch controls for aiming and launching

## Technologies Used

- A-Frame
- AR.js
- Cannon.js
- HTML5
- CSS3
- JavaScript

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ar-web-game.git
cd ar-web-game
```

2. Serve the application:
```bash
python3 -m http.server 8000
```

3. Access the application:
- Open your web browser
- Navigate to `http://localhost:8000`
- Allow camera permissions when prompted
- Point your camera at the Hiro marker

## Controls

- Use the sliders to adjust:
  - Spring constant (k)
  - Launch angle
  - Rotation angle
- Click the "Launch" button to fire projectiles
- Touch and drag on mobile devices to aim

## Requirements

- Modern web browser with camera support
- Camera permissions enabled
- Hiro marker for AR tracking

## License

MIT License 