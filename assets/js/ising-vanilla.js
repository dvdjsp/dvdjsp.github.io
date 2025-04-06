// Simple Ising model in vanilla JavaScript
class IsingModel {
  constructor(size = 20) {
    this.size = size;
    this.spins = Array(size*size).fill().map(() => Math.random() < 0.5 ? 1 : -1);
    this.temperature = 2.0;
  }
  
  // Run simulation steps
  simulateSteps(steps) {
    for (let step = 0; step < steps; step++) {
      // Random site
      const i = Math.floor(Math.random() * this.size);
      const j = Math.floor(Math.random() * this.size);
      const idx = i * this.size + j;
      
      // Calculate energy change
      let dE = 0;
      
      // Check neighbors (with periodic boundary)
      const neighbors = [
        ((i+1) % this.size) * this.size + j,  // down
        ((i-1+this.size) % this.size) * this.size + j,  // up
        i * this.size + ((j+1) % this.size),  // right
        i * this.size + ((j-1+this.size) % this.size)   // left
      ];
      
      for (const nIdx of neighbors) {
        dE += 2 * this.spins[idx] * this.spins[nIdx];
      }
      
      // Flip according to Metropolis
      if (dE <= 0 || Math.random() < Math.exp(-dE / this.temperature)) {
        this.spins[idx] *= -1;
      }
    }
  }
  
  // Draw to canvas
  draw(canvas) {
    const ctx = canvas.getContext('2d');
    const cellSize = Math.floor(canvas.width / this.size);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw cells
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const idx = i * this.size + j;
        ctx.fillStyle = this.spins[idx] === 1 ? 'black' : 'white';
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  }
  
  // Calculate magnetization
  getMagnetization() {
    return Math.abs(this.spins.reduce((sum, s) => sum + s, 0) / (this.size * this.size));
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const canvas = document.getElementById('ising-canvas');
  const tempSlider = document.getElementById('temp-slider');
  const tempValue = document.getElementById('temp-value');
  const magValue = document.getElementById('mag-value');
  const startStopBtn = document.getElementById('start-stop');
  const resetBtn = document.getElementById('reset');
  
  // Initialize model
  const model = new IsingModel(50);
  let running = false;
  let animationId = null;
  
  // Initial draw
  model.draw(canvas);
  
  // Update temperature label
  tempSlider.addEventListener('input', function() {
    model.temperature = parseFloat(this.value);
    tempValue.textContent = model.temperature.toFixed(2);
  });
  
  // Set initial temperature value
  tempValue.textContent = model.temperature.toFixed(2);
  
  // Start/stop simulation
  startStopBtn.addEventListener('click', function() {
    running = !running;
    this.textContent = running ? 'Stop' : 'Start';
    this.className = running ? 'btn stop' : 'btn start';
    
    if (running) {
      runSimulation();
    } else if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
  
  // Reset spins
  resetBtn.addEventListener('click', function() {
    model.spins = Array(model.size*model.size).fill().map(() => Math.random() < 0.5 ? 1 : -1);
    model.draw(canvas);
    magValue.textContent = model.getMagnetization().toFixed(3);
  });
  
  // Run simulation loop
  function runSimulation() {
    if (!running) return;
    
    // Simulate 5 steps per frame
    model.simulateSteps(5);
    
    // Draw the updated state
    model.draw(canvas);
    
    // Update magnetization display
    magValue.textContent = model.getMagnetization().toFixed(3);
    
    // Schedule the next frame
    animationId = requestAnimationFrame(runSimulation);
  }
});
