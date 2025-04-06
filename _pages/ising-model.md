---
layout: page
title: Interactive Ising Model Simulator
description: Real-time simulation of phase transitions in magnetic materials
img: assets/img/projects/ising-preview.png
importance: 1
category: physics
---

<div class="row">
  <div class="col-sm-12">
    <div class="project-description">
      <p>
        This interactive simulation demonstrates the Ising model, a mathematical model of ferromagnetism in statistical mechanics. 
        The model shows how individual magnetic spins align to create ordered (ferromagnetic) or disordered (paramagnetic) states 
        depending on temperature.
      </p>
    </div>
  </div>
</div>

<div class="row justify-content-center">
  <div class="col-lg-10">
    <div class="simulation-card">
      <div class="simulation-container">
        <div class="simulation-loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Loading simulation...</p>
        </div>
        <iframe 
          id="ising-simulation"
          src="https://dvdjsp.github.io/Graphs-Ising/" 
          title="Ising Model Simulation" 
          width="100%" 
          height="850" 
          frameborder="0"
          allowfullscreen
          onload="document.querySelector('.simulation-loading').style.display='none';">
        </iframe>
      </div>
      <div class="simulation-footer">
        <p>
          <strong>Instructions:</strong> Adjust the temperature slider to observe phase transitions. 
          Use the lattice type selector to change the underlying graph structure.
        </p>
      </div>
    </div>
  </div>
</div>

<div class="row mt-4">
  <div class="col-sm-12">
    <div class="physics-explanation">
      <h2>Physical Background</h2>
      <p>
        The Ising model is a cornerstone of statistical mechanics, describing systems where components have two states, 
        like the magnetic dipole moments of atomic "spins" that can be in one of two states (+1 or −1).
        At low temperatures, neighboring spins tend to align, creating long-range order (ferromagnetism).
        As temperature increases, thermal fluctuations eventually overcome the alignment tendency at a critical temperature,
        resulting in a phase transition to a disordered (paramagnetic) state.
      </p>
      <p>
        This simulation allows you to:
      </p>
      <ul>
        <li>Visualize the real-time evolution of spin states at different temperatures</li>
        <li>Experiment with different lattice structures (square, triangular, hexagonal)</li>
        <li>Calculate magnetization curves and identify critical temperatures</li>
        <li>Study the statistical nature of phase transitions</li>
      </ul>
    </div>
  </div>
</div>

<style>
.simulation-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  overflow: hidden;
  margin: 20px 0 40px 0;
}

.simulation-container {
  position: relative;
  width: 100%;
  background-color: #f8f9fa;
}

.simulation-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.simulation-loading p {
  margin-top: 10px;
  font-size: 16px;
  color: #6c757d;
}

.simulation-footer {
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-top: 1px solid #eaeaea;
  font-size: 0.9rem;
}

.project-description, .physics-explanation {
  font-size: 1.05rem;
  line-height: 1.7;
}

.physics-explanation h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.75rem;
}

.physics-explanation ul {
  padding-left: 20px;
}

.physics-explanation li {
  margin-bottom: 8px;
}
</style>
