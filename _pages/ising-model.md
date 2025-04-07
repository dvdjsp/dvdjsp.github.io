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

This interactive simulation demonstrates the Ising model, a mathematical model of ferromagnetism in statistical mechanics. The model shows how individual magnetic spins align to create ordered (ferromagnetic) or disordered (paramagnetic) states depending on temperature. Constructed using `Claude 3.7 Sonnet` inspired by [Francesco Sacco's work][https://francesco215.github.io/Language_CA/] and code from [Francesco215][https://github.com/Francesco215]. This simulation generalizes to any graph.

<div class="ising-embed">
  <iframe src="https://dvdjsp.github.io/Graphs-Ising/" title="Ising Model Simulation" frameborder="0"></iframe>
</div>

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
