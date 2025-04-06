---
layout: page
permalink: /ising/
title: Interactive Ising Model Simulator
description: Real-time simulation of phase transitions in magnetic materials
img: assets/img/projects/ising-preview.png
importance: 1
category: physics
---

# Interactive Ising Model Simulation

This interactive simulation demonstrates the Ising model, a mathematical model of ferromagnetism in statistical mechanics. The model shows how individual magnetic spins align to create ordered (ferromagnetic) or disordered (paramagnetic) states depending on temperature.

<div class="ising-embed">
  <iframe src="https://dvdjsp.github.io/Graphs-Ising/" title="Ising Model Simulation" frameborder="0"></iframe>
</div>

## Physical Background

The Ising model is a cornerstone of statistical mechanics, describing systems where components have two states, like the magnetic dipole moments of atomic "spins" that can be in one of two states (+1 or −1). At low temperatures, neighboring spins tend to align, creating long-range order (ferromagnetism). As temperature increases, thermal fluctuations eventually overcome the alignment tendency at a critical temperature, resulting in a phase transition to a disordered (paramagnetic) state.

This simulation allows you to:

- Visualize the real-time evolution of spin states at different temperatures
- Experiment with different lattice structures (square, triangular, hexagonal)
- Calculate magnetization curves and identify critical temperatures
- Study the statistical nature of phase transitions

<style>
.ising-embed {
  position: relative;
  width: 100%;
  height: 800px;
  margin: 25px 0;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  overflow: hidden;
}

.ising-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
