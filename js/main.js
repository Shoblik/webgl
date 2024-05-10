// Get reference to the canvas element
const canvas = document.getElementById('glCanvas');
const ctx = canvas.getContext('2d');

// Set the canvas size to match the viewport
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Array to store circles
let circles = [];

// Function to draw a circle
function drawCircle(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'blue'; // You can change the color here
    ctx.fill();
}

// Function to update circle positions
function update() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Loop through all circles
    for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        // Draw the circle
        drawCircle(circle.x, circle.y);

        // Update circle position based on its direction
        circle.x += circle.dx;
        circle.y += circle.dy;

        // Check if circle is out of bounds and mark it for deletion
        if (circle.x < -10 || circle.x > canvas.width + 10 || circle.y < -10 || circle.y > canvas.height + 10) {
            circle.markedForDeletion = true;
        }
    }

    // Remove circles marked for deletion
    circles = circles.filter(circle => !circle.markedForDeletion);

    // Request the next animation frame
    requestAnimationFrame(update);
}

// Event listener for mousemove events
canvas.addEventListener('mousemove', function(event) {
    // Get the mouse coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Create 10 new circle objects
    for (let i = 0; i < 10; i++) {
        const circle = {
            x: mouseX,
            y: mouseY,
            dx: 0, // X direction (horizontal) of the drift
            dy: 0, // Y direction (vertical) of the drift
        };

        // Set a random direction after a short delay
        const angle = Math.random() * Math.PI * 2;
        circle.dx = Math.cos(angle) * 2; // Adjust speed as needed
        circle.dy = Math.sin(angle) * 2; // Adjust speed as needed


        // Add the circle to the array
        circles.push(circle);
    }
});

// Call update function to start the animation
update();