---
layout: page
title: Interactive Ising Model Simulator
description: A real-time simulation of the Ising model showing phase transitions in magnetic materials
importance: 1
category: physics
---

# Interactive Ising Model Simulation

This interactive simulation demonstrates the Ising model, a mathematical model of ferromagnetism in statistical mechanics. The model consists of discrete variables that represent magnetic dipole moments of atomic spins that can be in one of two states (+1 or −1).

## About the Simulation

The simulator allows you to:
- Visualize the Ising model on different lattice types
- Adjust temperature to observe phase transitions
- Calculate magnetization curves
- Observe critical behavior near the phase transition

<div class="iframe-container">
  <iframe 
    src="https://dvdjsp.github.io/Graphs-Ising/" 
    title="Ising Model Simulation" 
    width="100%" 
    height="850" 
    frameborder="0"
    allowfullscreen>
  </iframe>
</div>

## Physical Background

The Ising model is one of the simplest models that shows a phase transition. At low temperatures, the spins align to form a ferromagnetic state, while at high temperatures, thermal fluctuations cause the spins to be randomly oriented in a paramagnetic state.

<style>
.iframe-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  margin: 20px 0;
  background-color: #f8f9fa;
}
</style>
