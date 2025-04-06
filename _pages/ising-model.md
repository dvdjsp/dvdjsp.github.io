---
layout: page
title: Ising Model Simulation
permalink: /ising-model/
---

<style>
  .simulation-container {
    margin: 20px 0;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }
  .canvas-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-width: 500px;
    margin: 0 auto;
  }
  .control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
  }
  .start { background-color: #4CAF50; color: white; }
  .stop { background-color: #f44336; color: white; }
  .reset { background-color: #2196F3; color: white; }
  .slider-container {
    flex-grow: 1;
    margin: 0 15px;
  }
  input[type=range] {
    width: 100%;
  }
</style>

<div class="simulation-container">
  <div class="canvas-container">
    <canvas id="ising-canvas" width="500" height="500" style="border: 1px solid #ccc;"></canvas>
  </div>
  
  <div class="controls">
    <div class="control-row">
      <span>Temperature: </span>
      <div class="slider-container">
        <input type="range" id="temp-slider" min="0.5" max="4.0" step="0.1" value="2.0">
      </div>
      <span id="temp-value">2.0</span>
    </div>
    
    <div class="control-row">
      <span>Magnetization: </span>
      <span id="mag-value">0.0</span>
    </div>
    
    <div class="control-row">
      <button id="start-stop" class="btn start">Start</button>
      <button id="reset" class="btn reset">Reset</button>
    </div>
  </div>
</div>

<p>
  This interactive simulation demonstrates the Ising model, a mathematical model of ferromagnetism in statistical mechanics. The Ising model consists of discrete variables that represent magnetic dipole moments of atomic spins that can be in one of two states (+1 or -1).
</p>

<p>
  <strong>How it works:</strong> Black cells represent spin up (+1) and white cells represent spin down (-1). At high temperatures, the system behaves randomly (disordered paramagnetic phase). At low temperatures, spins tend to align (ordered ferromagnetic phase). The critical temperature for a square lattice is approximately 2.27.
</p>

<script src="{{ '/assets/js/ising-vanilla.js' | relative_url }}"></script>
