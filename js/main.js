import { Rectangle } from "./Rectangle.js";
import { QuadTree } from "./QuadTree.js";

// Get reference to the canvas element
const canvas = document.getElementById('glCanvas');
const ctx = canvas.getContext('2d');

let circleCount = document.getElementById('spawnFreqSlider').value;
let circleSpeed= document.getElementById('circleSpeedSlider').value;
let worms = false;

// Set the canvas size to match the viewport
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// QuadTree setup
const quadTreeCapacity = 10; // Maximum number of circles in a quadrant
const quadTreeBounds = new Rectangle(0, 0, canvas.width, canvas.height);
const quadTree = new QuadTree(quadTreeBounds, quadTreeCapacity);

let collisionDetection = true;
let collisionType = 0;

let definedColors = ['white', 'magenta', 'hotpink'];
let colorIndex= 0;

// Array to store every rendered circle
let circles = [];
let circleRadius = Number(document.getElementById('radiusSlider').value);
let spawnAnimation;

const drawCircle = (circle) => {
    ctx.beginPath();
    // make circles grow here if desired
    let circleRadiusChange = 0;
    ctx.arc(circle.x, circle.y, circle.radius += circleRadiusChange, 0, Math.PI * 2);
    ctx.fillStyle = circle.color;
    ctx.fill();
};

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

// Function to update circle positions and handle collisions
const update = () => {
    // Calculate time elapsed since last frame
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;

    frameCount++;
    // Calculate FPS once every x milliseconds
    if (deltaTime > 500) {
        fps = Math.round((frameCount * 1000) / deltaTime);
        frameCount = 0;
        lastFrameTime = currentTime; // Update lastFrameTime only after FPS calculation
    }

    // Clear the canvas
    if (!worms) ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Clear the quad tree and insert circles
    quadTree.clear();
    for (const circle of circles) {
        quadTree.insert(circle);
    }

    // Loop through all circles
    for (let i = 0; i < circles.length; i++) {
        const circleA = circles[i];
        drawCircle(circleA);

        // Update circle position based on its direction
        circleA.x += circleA.dx;
        circleA.y += circleA.dy;

        // Check if circle is out of bounds and mark it for deletion
        if (circleA.x < -circleRadius || circleA.x > canvas.width + circleRadius || circleA.y < -circleRadius || circleA.y > canvas.height + circleRadius) {
            circleA.markedForDeletion = true;
        }

        if (collisionDetection) {
            // Get nearby circles from the quad tree
            const range = new Rectangle(circleA.x - circleRadius * 2, circleA.y - circleRadius * 2, circleRadius * 4, circleRadius * 4);
            const nearbyCircles = quadTree.query(range);

            // Check for collisions with nearby circles
            for (const circleB of nearbyCircles) {
                if (circleA !== circleB) {
                    const dx = circleB.x - circleA.x;
                    const dy = circleB.y - circleA.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < circleRadius * 2) {
                        // Circles collide, adjust velocities
                        const angle = Math.atan2(dy, dx);
                        const sine = Math.sin(angle);
                        const cosine = Math.cos(angle);

                        // Rotate circleA's velocity
                        const vx0 = circleA.dx * cosine + circleA.dy * sine;
                        const vy0 = circleA.dy * cosine - circleA.dx * sine;

                        // Rotate circleB's velocity
                        const vx1 = circleB.dx * cosine + circleB.dy * sine;
                        const vy1 = circleB.dy * cosine - circleB.dx * sine;

                        // New velocities after collision
                        const vxTotal = vx0 - vx1;
                        circleA.dx = ((circleA.radius - circleB.radius) * vx0 + 2 * circleB.radius * vx1) / (circleA.radius + circleB.radius);
                        circleB.dx = vxTotal + circleA.dx;

                        if (collisionType === 0) {
                            // Rotate velocities back
                            circleA.dy = vy0 * cosine + vx0 * sine;
                            circleA.dx = vx0 * cosine - vy0 * sine;
                            circleB.dy = vy1 * cosine + vx1 * sine;
                            circleB.dx = vx1 * cosine - vy1 * sine;
                        } else {
                            // New velocities after collision
                            circleA.dx = ((circleA.radius - circleB.radius) * circleA.dx + 2 * circleB.radius * circleB.dx) / (circleA.radius + circleB.radius);
                            circleB.dx = ((circleB.radius - circleA.radius) * circleB.dx + 2 * circleA.radius * circleA.dx) / (circleA.radius + circleB.radius);

                            circleA.dy = ((circleA.radius - circleB.radius) * circleA.dy + 2 * circleB.radius * circleB.dy) / (circleA.radius + circleB.radius);
                            circleB.dy = ((circleB.radius - circleA.radius) * circleB.dy + 2 * circleA.radius * circleA.dy) / (circleA.radius + circleB.radius);
                        }

                        // Update positions to avoid overlapping
                        const overlap = circleRadius * 2 - distance + 1;
                        circleA.x -= overlap * Math.cos(angle);
                        circleA.y -= overlap * Math.sin(angle);
                        circleB.x += overlap * Math.cos(angle);
                        circleB.y += overlap * Math.sin(angle);
                    }
                }
            }
        }
    }

    // Remove circles marked for deletion
    circles = circles.filter(circle => !circle.markedForDeletion);

    // Display FPS
    ctx.fillStyle = 'white';
    ctx.font = '16px Helvetica';
    ctx.fillText(`FPS: ${fps}`, 45, 20);

    // CPU and GPU engage, DO IT AGAIN!
    requestAnimationFrame(update);
};

const spawnNewCircles = (event = null, mouseX = null, mouseY = null, color = null) => {
    const circle = {
        x: mouseX,
        y: mouseY,
        dx: 0, // X direction (horizontal) of the drift
        dy: 0, // Y direction (vertical) of the drift
        color: color ?? generateRandomColor(),
        radius: circleRadius
    };

    // Set a random direction
    const angle = Math.random() * Math.PI * 2;
    circle.dx = Math.cos(angle) * circleSpeed; // Adjust speed as needed
    circle.dy = Math.sin(angle) * circleSpeed; // Adjust speed as needed

    // Add the circle to the array
    circles.push(circle);
};

let positionsToSpawn = [];
let spawnInterval = document.getElementById('spawnFreqSlider').value; // Spawn a batch of circles every x frames
const startFixedCircleSpawn = () => {
    let batchSize = 10; // Number of circles to spawn in each batch
    let spawnCounter = 0;

    const spawnBatch = () => {
        for (let i = 0; i < batchSize; i++) {
            const index = Math.floor(Math.random() * positionsToSpawn.length);
            const coords = positionsToSpawn[index];
            spawnNewCircles(null, coords[0], coords[1], coords[2]);
        }
    };

    const spawnLoop = () => {
        spawnCounter++;
        if (spawnCounter >= spawnInterval) {
            spawnBatch();
            spawnCounter = 0;
        }
        spawnAnimation = requestAnimationFrame(spawnLoop);
    };

    spawnLoop();
};

const generateRandomColor = () => {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);

    // Construct the color string in hexadecimal format
    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
};

function getNextColor() {
    let color = definedColors[colorIndex];
    colorIndex = (colorIndex + 1) % definedColors.length; // Increment index and wrap around if necessary
    return color;
}

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Event listener for mousedown event
document.addEventListener('mousedown', (event) => {
    // if left click
    if (event.button === 0) {
        // let determinedColor = getNextColor();

        positionsToSpawn.push([event.clientX, event.clientY, generateRandomColor()]);
        menu.displaySpawnPoints();
        if (!spawnAnimation) requestAnimationFrame(startFixedCircleSpawn);
    }

    // middle click removes a point, newest to oldest.
    if (event.button === 1) {
        positionsToSpawn.pop();
        menu.displaySpawnPoints();
        if (!positionsToSpawn.length) spawnAnimation = null;
    }
});

// menu event handlers
const menu = {
    menuOpen: false,

    updateMenuOnValChange: (target, value) => {
        document.getElementById(target).innerText = value;
    },

    initMenuVals: () => {
        menu.updateMenuOnValChange('circleRadiusValDisplay', circleRadius);
        menu.updateMenuOnValChange('spawnFreqValDisplay', spawnInterval);
        menu.updateMenuOnValChange('circleSpeedSliderValDisplay', circleSpeed);
    },

    initEventHandlers: () => {
        document.querySelectorAll('.menu, .submenu').forEach(menu => {
            menu.addEventListener('mousedown', (event) => {
                event.stopPropagation();
            });
        });

        document.getElementById('radiusSlider').addEventListener('input', (event) => {
            circleRadius = Number(event.target.value);
            menu.updateMenuOnValChange('circleRadiusValDisplay', circleRadius);
        })

        document.getElementById('spawnFreqSlider').addEventListener('input', (event) => {
            spawnInterval = Number(event.target.value);
            menu.updateMenuOnValChange('spawnFreqValDisplay', spawnInterval);
        })

        document.getElementById('circleSpeedSlider').addEventListener('input', (event) => {
            circleSpeed = Number(event.target.value);
            menu.updateMenuOnValChange('circleSpeedSliderValDisplay', circleSpeed);
        })

        document.getElementById('toggleMenuBtn').addEventListener('mousedown', () => {
            event.stopPropagation();
            menu.toggleMenu();
        });

        document.getElementById('collisionModes').addEventListener('change', (event) => {
            let collisionMode = event.target.value

            collisionDetection = true;
            if (collisionMode === 'standard') {
                collisionType = 0;
            } else if (collisionMode === 'advanced') {
                collisionType = 1;
            } else {
                // no collision
                collisionDetection = false;
            }
        })

        document.getElementById('worms').addEventListener('change', (event) => {
            worms = event.target.checked;
        })

        document.getElementById('clearSpawnPoints').addEventListener('mousedown', () => { mod.removeAllSpawnPoints() })
    },

    toggleMenu: () => {
        if (menu.menuOpen) {
            // close it
            document.getElementById('menu').classList.remove('show-menu');
            menu.menuOpen = false;
        } else {
            document.getElementById('menu').classList.add('show-menu');
            menu.menuOpen = true;
        }
    },

    displaySpawnPoints: function() {
        const spawnPoints = document.getElementById('spawnPoints');
        spawnPoints.innerHTML = '';

        positionsToSpawn.forEach((oneSpawn, index) => {
            let tmpBtn = document.createElement('button');
            let toolTipDiv = null;

            tmpBtn.style.background = oneSpawn[2];
            tmpBtn.innerText = index + 1;
            tmpBtn.addEventListener('mouseover', () => {
                toolTipDiv = mod.showSpawnPoint(oneSpawn[0], oneSpawn[1])
            });
            tmpBtn.addEventListener('mouseout', () => mod.removeSpawnPointDisplay(toolTipDiv));
            spawnPoints.appendChild(tmpBtn);
        });
    },

    clearSpawnPointsFromMenu: () => {
        document.getElementById('spawnPoints').innerHTML = '';
    }
}

const mod = {
    showSpawnPoint: (x,y) => {
        console.log(x + ', ' + y);

        // Create a div element
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = y + 'px'; // Position the div at the specified y coordinate
        div.style.left = x + 'px'; // Position the div at the specified x coordinate
        div.style.width = '35px'; // Set the width of the div
        div.style.height = '35px'; // Set the height of the div
        div.style.backgroundColor = 'red'; // Set the background color of the div
        div.style.border = '2px solid black'; // Set the border of the div
        div.style.zIndex = '1000'; // Set the z-index to ensure it appears above the canvas
        div.style.transform = 'translate(-50%, -50%)';

        // Append the div to the document body
        document.body.appendChild(div);

        return div;
    },

    removeSpawnPointDisplay: (div) => {
        div.remove();
    },

    removeAllSpawnPoints: () => {
        positionsToSpawn = [];
        spawnAnimation = null;
        menu.clearSpawnPointsFromMenu();
    }
}

menu.initEventHandlers()
menu.initMenuVals();

// Call update function to start the animation
update();