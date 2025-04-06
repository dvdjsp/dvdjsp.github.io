import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Label, ResponsiveContainer } from 'recharts';
import * as d3 from 'd3';
// COMPREHENSIVE FIX FOR ISING MODEL
class IsingModel {
  constructor(adjacencyMatrix) {
    // Make sure we have a valid adjacency matrix
    if (!adjacencyMatrix || adjacencyMatrix.length === 0) {
      throw new Error("Invalid adjacency matrix");
    }
    
    this.adjacencyMatrix = adjacencyMatrix;
    this.numNodes = adjacencyMatrix.length;
    
    // Initialize spins with a more controlled distribution (50/50)
    this.state = Array(this.numNodes).fill().map((_, i) => 
      i % 2 === 0 ? 1 : -1 // Alternating pattern to ensure good distribution
    );
    
    // Then shuffle the array to avoid any spatial patterns
    this.shuffleSpins();
    
    this.J = -1.0; // Ferromagnetic coupling
    
    // IMPROVED: Verify and pre-compute neighbor lists
    this.verifyAndComputeNeighbors();
    
    // Calculate initial energy
    this.energy = this.calculateTotalEnergy();
    
    // Debug info
    console.log(`Initialized Ising model with ${this.numNodes} nodes`);
    console.log(`Total initial connections: ${this.getTotalConnections()}`);
    console.log(`Average connections per node: ${this.getAverageConnections().toFixed(2)}`);
  }
  
  // Utility to shuffle spins randomly
  shuffleSpins() {
    // Fisher-Yates shuffle
    for (let i = this.state.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.state[i], this.state[j]] = [this.state[j], this.state[i]];
    }
  }
  
  // Enhanced debug method to get total connections
  getTotalConnections() {
    return this.neighbors.reduce((total, node) => total + node.indices.length, 0);
  }
  
  // Enhanced debug method to get average connections per node
  getAverageConnections() {
    return this.getTotalConnections() / this.numNodes;
  }
  
  // IMPROVED: Verify and compute neighbors with additional checks
  verifyAndComputeNeighbors() {
    this.neighbors = [];
    let totalConnections = 0;
    let disconnectedNodes = 0;
    
    for (let i = 0; i < this.numNodes; i++) {
      const neighbors = [];
      const couplings = [];
      
      for (let j = 0; j < this.numNodes; j++) {
        // Skip self-connections (diagonal elements)
        if (i === j) continue;
        
        // Check if there is a connection
        if (this.adjacencyMatrix[i][j] !== 0) {
          neighbors.push(j);
          couplings.push(this.adjacencyMatrix[i][j]);
        }
      }
      
      this.neighbors.push({ indices: neighbors, couplings: couplings });
      
      totalConnections += neighbors.length;
      if (neighbors.length === 0) {
        disconnectedNodes++;
      }
    }
    
    if (disconnectedNodes > 0) {
      console.warn(`Warning: ${disconnectedNodes} nodes have no connections!`);
    }
    
    console.log(`Verified graph: ${totalConnections} total connections, ${disconnectedNodes} isolated nodes`);
  }
  
  // Calculate energy change from flipping spin at site index
  calculateDeltaEnergy(siteIndex) {
    const spin = this.state[siteIndex];
    let energyContribution = 0;
    
    // Only iterate through actual neighbors instead of entire matrix
    const { indices, couplings } = this.neighbors[siteIndex];
    
    for (let i = 0; i < indices.length; i++) {
      const neighborIndex = indices[i];
      const coupling = couplings[i];
      
      // Additional bounds check
      if (neighborIndex >= 0 && neighborIndex < this.numNodes) {
        energyContribution += coupling * this.state[neighborIndex];
      } else {
        console.error(`Invalid neighbor index: ${neighborIndex} for site ${siteIndex}`);
      }
    }
    
    // Energy change for flipping this spin
    return -2 * this.J * spin * energyContribution;
  }
  
  // Calculate total energy of the system
  calculateTotalEnergy() {
    let energy = 0;
    
    for (let i = 0; i < this.numNodes; i++) {
      const { indices, couplings } = this.neighbors[i];
      
      for (let j = 0; j < indices.length; j++) {
        // Safety check for valid index
        if (indices[j] >= this.numNodes) continue;
        
        // Divide by 2 to avoid double counting
        energy += -0.5 * this.J * this.state[i] * this.state[indices[j]] * couplings[j];
      }
    }
    
    return energy;
  }
  
  // FIXED: Run simulation steps using Metropolis algorithm with proper scaling
  simulationSteps(temperature, nSteps) {
    // Scale nSteps to ensure each site has a chance to be updated
    // We want on average nSteps update attempts per site
    const totalAttempts = nSteps * this.numNodes;
    
    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      // Select a random site
      const site = Math.floor(Math.random() * this.numNodes);
      
      // Calculate energy change if we flip the spin
      const deltaE = this.calculateDeltaEnergy(site);
      
      // Accept or reject the flip based on Metropolis criterion
      if (deltaE <= 0 || Math.random() < Math.exp(-deltaE / temperature)) {
        this.state[site] *= -1;
        this.energy += deltaE;
      }
    }
    
    return [...this.state];
  }
  
  // Calculate magnetization (average spin)
  calculateMagnetization() {
    return this.state.reduce((sum, spin) => sum + spin, 0) / this.numNodes;
  }
  
  // Calculate absolute magnetization
  calculateAbsoluteMagnetization() {
    return Math.abs(this.calculateMagnetization());
  }
}

// IMPROVED: Parse CSV format from Mathematica sparse array export
// With better validation and debugging
const parseCSVToAdjacencyMatrix = (csvText) => {
  try {
    const lines = csvText.trim().split('\n');
    let maxRowCol = 0;
    const entries = [];
    
    console.log(`Processing ${lines.length} lines from CSV file`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue; // Skip empty lines or comments
      
      const parts = line.split(',').map(part => part.trim());
      if (parts.length < 3) {
        console.error(`Invalid line format at line ${i+1}: ${line}`);
        continue;
      }
      
      const row = parseInt(parts[0], 10);
      const col = parseInt(parts[1], 10);
      const value = parseFloat(parts[2]);
      
      if (isNaN(row) || isNaN(col) || isNaN(value)) {
        console.error(`Invalid numeric values at line ${i+1}: ${line}`);
        continue;
      }
      
      // Validate row and column indices (must be positive)
      if (row <= 0 || col <= 0) {
        console.error(`Invalid row/column indices (must be > 0) at line ${i+1}: ${line}`);
        continue;
      }
      
      maxRowCol = Math.max(maxRowCol, row, col);
      entries.push({ row, col, value });
    }
    
    if (entries.length === 0) {
      throw new Error("No valid entries found in CSV file");
    }
    
    console.log(`Found ${entries.length} valid connections with max index ${maxRowCol}`);
    
    // Initialize adjacency matrix with zeros
    const adjMatrix = Array(maxRowCol).fill().map(() => Array(maxRowCol).fill(0));
    
    // Fill in the matrix (Mathematica indices are 1-based)
    entries.forEach(({ row, col, value }) => {
      // Convert from 1-based to 0-based indices
      const r = row - 1;
      const c = col - 1;
      
      // Check for valid indices
      if (r < 0 || r >= maxRowCol || c < 0 || c >= maxRowCol) {
        console.error(`Invalid indices after conversion: ${r}, ${c}`);
        return;
      }
      
      adjMatrix[r][c] = value;
      
      // IMPORTANT: Ensure matrix is symmetric (undirected graph)
      // This is critical for the Ising model to work correctly
      adjMatrix[c][r] = value;
    });
    
    // Validate matrix
    let totalConnections = 0;
    let disconnectedNodes = 0;
    
    for (let i = 0; i < maxRowCol; i++) {
      let hasConnection = false;
      for (let j = 0; j < maxRowCol; j++) {
        if (i !== j && adjMatrix[i][j] !== 0) {
          hasConnection = true;
          totalConnections++;
        }
      }
      if (!hasConnection) {
        disconnectedNodes++;
      }
    }
    
    console.log(`Adjacency matrix created: ${maxRowCol}x${maxRowCol} with ${totalConnections} total connections`);
    if (disconnectedNodes > 0) {
      console.warn(`Warning: ${disconnectedNodes} nodes appear to be isolated!`);
    }
    
    return adjMatrix;
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
};

// The rest of the code remains unchanged...
// [Include all remaining code from the MagnetizationCalculator component]
// Static Ising View component for simulation
// CRITICAL FIX 1: Modified StaticIsingView to ensure proper spin mapping

function StaticIsingView({ adjacencyMatrix, spins, positions }) {
  const svgRef = useRef(null);
  const [transform, setTransform] = useState(null);
  
  // One-time initialization of the static view
  useEffect(() => {
    if (!svgRef.current || !positions || !positions.length || !adjacencyMatrix) return;
    
    console.log(`Initializing static view with ${positions.length} positions and ${spins.length} spins`);
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Create a container for all elements
    const g = svg.append('g')
      .attr('class', 'static-container');
    
    // Create zoom behavior that only affects the transform
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTransform(event.transform);
      });
    
    svg.call(zoom);
    
    // Draw the links - ensure we have positions for both ends
    const links = [];
    for (let i = 0; i < adjacencyMatrix.length; i++) {
      for (let j = i + 1; j < adjacencyMatrix.length; j++) {
        if (adjacencyMatrix[i][j] !== 0) {
          const source = positions[i];
          const target = positions[j];
          if (source && target) {
            // Store original indices to ensure proper mapping
            links.push({ 
              source: source, 
              target: target,
              sourceId: i,
              targetId: j
            });
          }
        }
      }
    }
    
    g.selectAll('.static-link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'static-link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', '#999')
      .attr('stroke-width', 1);
    
    // Draw the nodes with initial colors and store the node index
    // CRITICAL: We need to ensure node data has the correct id 
    const nodeData = positions.map((pos, i) => ({
      ...pos,
      nodeId: i,  // Store the original index for mapping to spin array
      spin: spins[i] || 0  // Initial spin state
    }));
    
    g.selectAll('.static-node')
      .data(nodeData)
      .enter()
      .append('circle')
      .attr('class', 'static-node')
      .attr('r', 8)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('data-node-id', d => d.nodeId)  // Store index as data attribute
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('fill', d => d.spin === 1 ? 'black' : 'white');  // Initial color
    
    // Calculate bounding box for initial fit
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Find the bounds of the graph
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    positions.forEach(pos => {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    });
    
    // Add padding
    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    if (graphWidth > 0 && graphHeight > 0) {
      const scale = 0.9 * Math.min(width / graphWidth, height / graphHeight);
      const tx = width / 2 - (minX + graphWidth / 2) * scale;
      const ty = height / 2 - (minY + graphHeight / 2) * scale;
      
      // Initial transform to fit the graph
      const initialTransform = d3.zoomIdentity.translate(tx, ty).scale(scale);
      svg.call(zoom.transform, initialTransform);
    }
  }, [adjacencyMatrix, positions]);
  
  // CRITICAL FIX: This is the key part - update node colors based on proper mapping to spins
  useEffect(() => {
    if (!svgRef.current || !spins || !spins.length) return;
    
    // Count the distribution to verify proper updates
    let blackCount = 0;
    let whiteCount = 0;
    
    // Update node colors based on their stored node ID and the corresponding spin
    d3.select(svgRef.current)
      .selectAll('.static-node')
      .attr('fill', function() {
        // Get the node ID from the data attribute
        const nodeId = parseInt(d3.select(this).attr('data-node-id'));
        
        // Get the spin state for this node
        const spin = nodeId < spins.length ? spins[nodeId] : 0;
        
        // Update color counts for verification
        if (spin === 1) blackCount++;
        else whiteCount++;
        
        return spin === 1 ? 'black' : 'white';
      });
    
    // Verify the distribution matches what we expect
    const total = blackCount + whiteCount;
    const blackRatio = blackCount / total;
    console.log(`Spin distribution: ${blackCount}/${total} black (${(blackRatio*100).toFixed(1)}%), ${whiteCount}/${total} white`);
    
  }, [spins]);
  
  return (
    <svg ref={svgRef} width="100%" height="700px" className="border rounded"></svg>
  );
}

// Enhanced graph preview component with SpringElectricalEmbedding-like algorithm
function GraphPreview({ adjacencyMatrix, spins, onSvgRef }) {
  const svgRef = useRef(null);
  const [isStretched, setIsStretched] = useState(false);
  const simulationRef = useRef(null);
  const [continuousSimulation, setContinuousSimulation] = useState(false);
  const continuousTimerRef = useRef(null);
  const [isShaking, setIsShaking] = useState(false);
  const shakingTimerRef = useRef(null);
  
  // Make sure to provide svg ref to parent when it's ready
  useEffect(() => {
    if (svgRef.current && onSvgRef) {
      onSvgRef(svgRef.current);
    }
  }, [svgRef.current, onSvgRef]);
  
  const toggleStretch = () => {
    if (!simulationRef.current) {
      console.log("No simulation to toggle");
      return;
    }
    
    // Toggle the stretched state
    const newState = !isStretched;
    setIsStretched(newState);
    
    const simulation = simulationRef.current;
    
    // Change force parameters based on new state
    const forceStrength = newState ? -100 : -30;
    const linkDistance = newState ? 60 : 30;
    const springStrength = newState ? 0.05 : 0.3;
    
    // Update simulation parameters
    simulation.force('charge').strength(forceStrength);
    simulation.force('link')
      .distance(linkDistance)
      .strength(springStrength);
    
    // Restart the D3 layout simulation with high energy
    simulation.alpha(1).restart();
    
    console.log(`Graph stretch toggled: ${newState ? 'Stretching' : 'Freezing'}`);
  };
  
  // Add explicit function to stop the stretch simulation (D3 layout)
  const stopStretch = () => {
    console.log("Stopping graph stretch simulation");
    
    if (simulationRef.current) {
      // Actually stop the D3 force simulation
      simulationRef.current.stop();
      
      // Make sure we're in "frozen" state
      setIsStretched(false);
      
      // Clear continuous simulation if active
      if (continuousTimerRef.current) {
        clearInterval(continuousTimerRef.current);
        continuousTimerRef.current = null;
      }
      
      // Clear shaking timer if active
      if (shakingTimerRef.current) {
        clearTimeout(shakingTimerRef.current);
        shakingTimerRef.current = null;
        setIsShaking(false);
      }
    }
  };
  
  // Toggle continuous simulation mode
  const toggleContinuousSimulation = () => {
    const newState = !continuousSimulation;
    setContinuousSimulation(newState);
    
    if (newState && simulationRef.current) {
      // Start continuous simulation by periodically "reheating"
      continuousTimerRef.current = setInterval(() => {
        if (simulationRef.current && simulationRef.current.alpha() < 0.1) {
          simulationRef.current.alpha(0.3).restart();
        }
      }, 2000); // Reheat every 2 seconds if alpha gets too low
      
      // Initial kick
      simulationRef.current.alpha(0.5).restart();
    } else {
      // Stop continuous simulation
      if (continuousTimerRef.current) {
        clearInterval(continuousTimerRef.current);
        continuousTimerRef.current = null;
      }
    }
  };
  
  // Add a function to aggressively shake/untangle the graph
  const shakeGraph = () => {
    if (!simulationRef.current || isShaking) return;
    
    setIsShaking(true);
    const simulation = simulationRef.current;
    
    // Store original force parameters
    const originalChargeStrength = simulation.force('charge').strength()();
    const originalLinkDistance = simulation.force('link').distance()();
    const originalLinkStrength = simulation.force('link').strength()();
    
    // Apply very aggressive forces to untangle
    simulation.force('charge').strength(-500); // Much stronger repulsion
    
    // Add jitter force if it doesn't exist
    if (!simulation.force('jitter')) {
      simulation.force('jitter', () => {
        const nodes = simulation.nodes();
        // Apply random forces to all nodes
        nodes.forEach(node => {
          node.vx = (node.vx || 0) + (Math.random() - 0.5) * 10;
          node.vy = (node.vy || 0) + (Math.random() - 0.5) * 10;
        });
      });
    }
    
    // Increase link distance dramatically
    simulation.force('link')
      .distance(d => originalLinkDistance * 3) // 3x the original distance
      .strength(0.01); // Very weak springs during shaking
    
    // Heat up the simulation
    simulation.alpha(1).restart();
    
    // Disable the shake button during shaking to prevent multiple clicks
    const shakeDuration = 1500; // 1.5 seconds of violent shaking
    
    // After the shake period, gradually return to normal
    shakingTimerRef.current = setTimeout(() => {
      if (simulationRef.current) {
        // Remove jitter force
        simulation.force('jitter', null);
        
        // Gradually return to original parameters
        simulation.force('charge').strength(originalChargeStrength);
        simulation.force('link')
          .distance(originalLinkDistance)
          .strength(originalLinkStrength);
        
        // Keep simulation hot enough to continue moving
        simulation.alpha(0.3).restart();
      }
      
      setIsShaking(false);
      shakingTimerRef.current = null;
    }, shakeDuration);
  };
  
  // Function to fit graph to screen
  const fitToScreen = () => {
    if (!svgRef.current || !simulationRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 600;
    
    // Get current nodes from simulation
    const nodes = simulationRef.current.nodes();
    
    // Find the bounds of the graph
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      if (node.x !== undefined) {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x);
        maxY = Math.max(maxY, node.y);
      }
    });
    
    // Add padding
    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Calculate zoom scale to fit the graph
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    if (graphWidth <= 0 || graphHeight <= 0) return;
    
    const scale = Math.min(width / graphWidth, height / graphHeight);
    
    // Calculate translation to center the graph
    const translate = [
      (width - graphWidth * scale) / 2 - minX * scale, 
      (height - graphHeight * scale) / 2 - minY * scale
    ];
    
    // Apply the transform with transition
    svg.transition().duration(500).call(
      d3.zoom().transform,
      d3.zoomIdentity
        .translate(translate[0], translate[1])
        .scale(scale * 0.95) // Slightly smaller to ensure everything fits
    );
  };
  
  useEffect(() => {
    if (!adjacencyMatrix || !svgRef.current) return;
    
    const width = svgRef.current.clientWidth || 600;
    const height = svgRef.current.clientHeight || 600;
    const nodeRadius = 8;
    
    // Calculate boundary scale factor based on adjacency matrix size
    // More nodes = more space needed
    const nodeCount = adjacencyMatrix.length;
    const scaleFactor = Math.max(6, Math.min(20, Math.ceil(Math.sqrt(nodeCount) * 1.5)));
    
    // Create a virtual space that scales with graph size
    const virtualWidth = width * scaleFactor;
    const virtualHeight = height * scaleFactor;
    
    // Create nodes and links from adjacency matrix
    const n = adjacencyMatrix.length;
    const nodes = Array(n).fill().map((_, i) => ({ 
      id: i,
      // Initialize with random positions in a reasonable range
      x: virtualWidth/2 + (Math.random() - 0.5) * virtualWidth * 0.5,
      y: virtualHeight/2 + (Math.random() - 0.5) * virtualHeight * 0.5
    }));
    
    const links = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (adjacencyMatrix[i][j] !== 0) {
          links.push({ source: i, target: j });
        }
      }
    }
    
    // Create SVG elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Create group for links and nodes
    const g = svg.append('g');
    
    // Create the links
    const link = g.selectAll('.link')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-width', 1);
    
    // Create the nodes with correct colors based on spins if available
    const node = g.selectAll('.node')
      .data(nodes)
      .join('circle')
      .attr('class', 'node')
      .attr('r', nodeRadius)
      .attr('fill', (d, i) => spins && i < spins.length ? (spins[i] === 1 ? 'black' : 'white') : '#000')
      .attr('stroke', '#333')
      .attr('stroke-width', 1);
    
    // Starting force parameters
    const forceStrength = isStretched ? -100 : -30;
    const linkDistance = isStretched ? 60 : 30;
    const springStrength = isStretched ? 0.05 : 0.3;
    
    // Set up force simulation with lower alphaDecay to make it run longer
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(linkDistance).strength(springStrength))
      .force('charge', d3.forceManyBody().strength(forceStrength))
      .force('center', d3.forceCenter(virtualWidth / 2, virtualHeight / 2))
      .velocityDecay(0.4) // Slightly higher damping to prevent excessive oscillation
      .alphaDecay(0.005) // Slower decay for longer-running simulation
      .alphaMin(0.0001); // Lower min alpha to let it run longer
    
    // Save reference to simulation
    simulationRef.current = simulation;
    
    // Create a zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    // Apply the zoom behavior to the SVG
    svg.call(zoomBehavior);
    
    // Update positions on tick with scaled larger boundary
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      // Use boundary constraints with the virtual space
      node
        .attr('cx', d => d.x = Math.max(nodeRadius, Math.min(virtualWidth - nodeRadius, d.x)))
        .attr('cy', d => d.y = Math.max(nodeRadius, Math.min(virtualHeight - nodeRadius, d.y)));
    });
    
    // Initial stabilization
    for (let i = 0; i < 300; i++) {
      simulation.tick();
    }
    
    // Fit the graph to the screen
    setTimeout(fitToScreen, 100);
    
    // If continuous simulation mode is active, start the timer
    if (continuousSimulation) {
      toggleContinuousSimulation();
    }
    
    // Cleanup on unmount
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      
      if (continuousTimerRef.current) {
        clearInterval(continuousTimerRef.current);
        continuousTimerRef.current = null;
      }
      
      if (shakingTimerRef.current) {
        clearTimeout(shakingTimerRef.current);
        shakingTimerRef.current = null;
      }
    };
  }, [adjacencyMatrix, spins]); 
  
  // Calculate scale factor for displaying in the UI
  const nodeCount = adjacencyMatrix ? adjacencyMatrix.length : 0;
  const displayScaleFactor = Math.max(6, Math.min(20, Math.ceil(Math.sqrt(nodeCount) * 1.5)));
  
  return (
    <div className="flex flex-col h-full">
      <svg ref={svgRef} width="100%" height="700px" className="border rounded"></svg>
      <div className="flex flex-col gap-2">
        <div className="flex mt-2 justify-between flex-wrap gap-2">
          <button 
            onClick={toggleStretch}
            className={`text-sm py-2 px-3 rounded font-bold ${
              isStretched 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-600 text-white'
            }`}
          >
            {isStretched ? 'Freeze Graph' : 'Stretch Graph'}
          </button>
          
          <button
            onClick={shakeGraph}
            disabled={isShaking}
            className={`text-sm py-2 px-3 rounded font-bold ${
              isShaking 
                ? 'bg-purple-300 text-white cursor-not-allowed' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isShaking ? 'Untangling...' : 'Untangle Graph!'}
          </button>
          
          <button
            onClick={toggleContinuousSimulation}
            className={`text-sm py-2 px-3 rounded font-bold ${
              continuousSimulation 
                ? 'bg-green-600 text-white' 
                : 'bg-yellow-500 text-white'
            }`}
          >
            {continuousSimulation ? 'Continuous: ON' : 'Continuous: OFF'}
          </button>
          
          <button
            onClick={stopStretch}
            className="text-sm py-2 px-3 rounded bg-red-600 text-white font-bold"
          >
            Stop Stretch
          </button>
          
          <button
            onClick={fitToScreen}
            className="text-sm py-2 px-3 rounded bg-gray-600 text-white font-bold"
          >
            Fit to Screen
          </button>
        </div>
        <div className="text-xs text-gray-500 text-center">
          Virtual boundary: {displayScaleFactor}x screen size ({nodeCount} nodes) | 
          {isShaking ? " Untangling in progress... " : ""}
          {continuousSimulation ? " Simulation will run continuously" : " Simulation will stop when stable"}
        </div>
      </div>
    </div>
  );
}

// Main component
function MagnetizationCalculator() {
  // Parse CSV format from Mathematica sparse array export
  const parseCSVToAdjacencyMatrix = (csvText) => {
    try {
      const lines = csvText.trim().split('\n');
      let maxRowCol = 0;
      const entries = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue; // Skip empty lines or comments
        
        const parts = line.split(',').map(part => part.trim());
        if (parts.length < 3) {
          console.error(`Invalid line format at line ${i+1}: ${line}`);
          continue;
        }
        
        const row = parseInt(parts[0], 10);
        const col = parseInt(parts[1], 10);
        const value = parseFloat(parts[2]);
        
        if (isNaN(row) || isNaN(col) || isNaN(value)) {
          console.error(`Invalid numeric values at line ${i+1}: ${line}`);
          continue;
        }
        
        maxRowCol = Math.max(maxRowCol, row, col);
        entries.push({ row, col, value });
      }
      
      if (entries.length === 0) {
        throw new Error("No valid entries found in CSV file");
      }
      
      // Initialize adjacency matrix with zeros
      const adjMatrix = Array(maxRowCol).fill().map(() => Array(maxRowCol).fill(0));
      
      // Fill in the matrix (Mathematica indices are 1-based)
      entries.forEach(({ row, col, value }) => {
        adjMatrix[row-1][col-1] = value;
      });
      
      return adjMatrix;
    } catch (error) {
      console.error("Error parsing CSV:", error);
      throw new Error(`Failed to parse CSV: ${error.message}`);
    }
  };

  // Graph data
  const [adjacencyMatrix, setAdjacencyMatrix] = useState(null);
  const [graphStats, setGraphStats] = useState({ nodes: 0, edges: 0 });
  const [isGraphLoaded, setIsGraphLoaded] = useState(false);
  
  // File upload state
  const [fileError, setFileError] = useState(null);
  
  // Temperature parameters
  const [tempMin, setTempMin] = useState(0.5);
  const [tempMax, setTempMax] = useState(4.0);
  const [tempPoints, setTempPoints] = useState(20);
  
  // ADDITIONS FOR DUAL VIEW:
  const [nodePositions, setNodePositions] = useState([]);
  const [showSimulationView, setShowSimulationView] = useState(false);
  
  // Ising model real-time simulation state
  const [isRealTimeSimulating, setIsRealTimeSimulating] = useState(false);
  const [simulationTemp, setSimulationTemp] = useState(1.5);
  const [timeScale, setTimeScale] = useState(100); // Default 100 steps per frame
  const [spins, setSpins] = useState([]);
  const [magnetization, setMagnetization] = useState(0);
  const [absoluteMagnetization, setAbsoluteMagnetization] = useState(0);
  const [energy, setEnergy] = useState(0);
  const isingModelRef = useRef(null);
  const animationFrameRef = useRef(null);
  const svgRef = useRef(null);
  
  // Removed Binder cumulant display toggle
  const [useTwoStageSampling, setUseTwoStageSampling] = useState(true);
  const [firstRunComplete, setFirstRunComplete] = useState(false);
  const [initialTcEstimate, setInitialTcEstimate] = useState(null);
  
  // Simulation parameters
  const [equilibrationSteps, setEquilibrationSteps] = useState(5000);
  const [measurementSteps, setMeasurementSteps] = useState(500);
  const [measurementTrials, setMeasurementTrials] = useState(50);
  
  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Set up default state for measurement data
  const [magnetizationData, setMagnetizationData] = useState([]);
  const [criticalTemp, setCriticalTemp] = useState(null);
  const [calculationTime, setCalculationTime] = useState(0);
  
  // Abort controller for stopping calculations
  const abortController = useRef(null);
  
  // Known critical temperatures for common lattices
  const KNOWN_CRITICAL_TEMPS = {
    grid: 2.27, // Square lattice
    triangular: 3.64, // Triangular lattice 
    hexagonal: 1.52  // Hexagonal lattice
  };
  
  // Get reference to the SVG element from GraphPreview
  const handleSvgRef = (ref) => {
    svgRef.current = ref;
  };
  
  // Capture node positions from the graph
  const captureNodePositions = () => {
    if (!svgRef.current) return [];
    
    // Extract positions directly from DOM
    const positions = [];
    const nodeElements = d3.select(svgRef.current).selectAll('.node');
    
    nodeElements.each(function(d, i) {
      const node = d3.select(this);
      positions[i] = {
        id: i,
        x: parseFloat(node.attr('cx')),
        y: parseFloat(node.attr('cy'))
      };
    });
    
    console.log(`Captured ${positions.length} node positions`);
    return positions;
  };
  
  // Handle simulation temperature change
  const handleSimulationTempChange = (e) => {
    setSimulationTemp(parseFloat(e.target.value));
  };
  
  // Handle time scale change
  const handleTimeScaleChange = (e) => {
    setTimeScale(parseInt(e.target.value, 10));
  };
  
  // Initialize Ising model when graph is loaded
  const initializeIsingModel = () => {
    if (!adjacencyMatrix) return;
    
    isingModelRef.current = new IsingModel(adjacencyMatrix);
    setSpins([...isingModelRef.current.state]);
    setMagnetization(isingModelRef.current.calculateMagnetization());
    setAbsoluteMagnetization(isingModelRef.current.calculateAbsoluteMagnetization());
    setEnergy(isingModelRef.current.energy);
  };
  
  // Toggle real-time Ising model simulation with dual view
  const toggleRealTimeSimulation = () => {
    console.log(`${isRealTimeSimulating ? 'Stopping' : 'Starting'} Ising magnet simulation`);
    
    // Initialize Ising model if needed
    if (!isingModelRef.current && !isRealTimeSimulating) {
      console.log("Initializing Ising model before simulation");
      initializeIsingModel();
    }
    
    if (!isRealTimeSimulating) {
      // STARTING SIMULATION
      
      // Capture the current positions
      const positions = captureNodePositions();
      console.log(`Captured ${positions.length} node positions for static view`);
      
      // Store positions and switch to static view
      setNodePositions(positions);
      setShowSimulationView(true);
      
      // Make sure we have the current spin values
      if (isingModelRef.current) {
        setSpins([...isingModelRef.current.state]);
      }
    } else {
      // STOPPING SIMULATION
      
      // Switch back to interactive view
      setShowSimulationView(false);
    }
    
    setIsRealTimeSimulating(!isRealTimeSimulating);
  };
  
  // Ising simulation effect for static view
  useEffect(() => {
    if (!isRealTimeSimulating || !isingModelRef.current) return;
    
    console.log("Starting Ising simulation loop");
    
    // Run initial steps to settle the system at the current temperature
    isingModelRef.current.simulationSteps(simulationTemp, 200);
    
    // Update spins state after initial steps
    setSpins([...isingModelRef.current.state]);
    setMagnetization(isingModelRef.current.calculateMagnetization());
    setAbsoluteMagnetization(isingModelRef.current.calculateAbsoluteMagnetization());
    setEnergy(isingModelRef.current.energy);
    
    const runIsingSimulation = () => {
      try {
        // Use the timeScale slider value to determine steps per frame
        const stepsPerFrame = Math.min(500, Math.max(50, timeScale));
        
        // Run simulation steps
        isingModelRef.current.simulationSteps(simulationTemp, stepsPerFrame);
        
        // Keep a local copy of the updated spin states
        const newSpins = [...isingModelRef.current.state];
        
        // Update React state (this will trigger a re-render of the static view)
        setSpins(newSpins);
        
        // Update stats occasionally
        if (Math.random() < 0.2) {
          setMagnetization(isingModelRef.current.calculateMagnetization());
          setAbsoluteMagnetization(isingModelRef.current.calculateAbsoluteMagnetization());
          setEnergy(isingModelRef.current.energy);
        }
      } catch (error) {
        console.error("Error in Ising simulation step:", error);
        setIsRealTimeSimulating(false);
        return;
      }
      
      // Continue only if still simulating
      if (isRealTimeSimulating) {
        animationFrameRef.current = requestAnimationFrame(runIsingSimulation);
      }
    };
    
    // Start the Ising animation loop
    animationFrameRef.current = requestAnimationFrame(runIsingSimulation);
    
    // Cleanup
    return () => {
      console.log("Stopping Ising simulation loop");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRealTimeSimulating, simulationTemp, timeScale]);
  
  // MODIFIED: Reset spins to random configuration - now works during simulation
  const resetSpins = () => {
    if (!isingModelRef.current) return;
    
    // Randomize spins without stopping simulation
    isingModelRef.current.state = Array(isingModelRef.current.numNodes).fill().map(() => Math.random() < 0.5 ? 1 : -1);
    isingModelRef.current.energy = isingModelRef.current.calculateTotalEnergy();
    
    // Update state
    setSpins([...isingModelRef.current.state]);
    setMagnetization(isingModelRef.current.calculateMagnetization());
    setAbsoluteMagnetization(isingModelRef.current.calculateAbsoluteMagnetization());
    setEnergy(isingModelRef.current.energy);
  };
  
  // MODIFIED: Set all spins to the same value - now works during simulation
  const setAllSpins = (value) => {
    if (!isingModelRef.current) return;
    
    // Set all spins to value without stopping simulation
    isingModelRef.current.state = Array(isingModelRef.current.numNodes).fill(value);
    isingModelRef.current.energy = isingModelRef.current.calculateTotalEnergy();
    
    // Update state
    setSpins([...isingModelRef.current.state]);
    setMagnetization(isingModelRef.current.calculateMagnetization());
    setAbsoluteMagnetization(isingModelRef.current.calculateAbsoluteMagnetization());
    setEnergy(isingModelRef.current.energy);
  };
  
  // Determine phase based on temperature relative to critical point
  const getPhaseDescription = () => {
    if (!criticalTemp) return "Unknown";
    
    if (simulationTemp < criticalTemp * 0.8) {
      return "Ordered (Ferromagnetic)";
    } else if (simulationTemp > criticalTemp * 1.2) {
      return "Disordered (Paramagnetic)";
    } else {
      return "Near Critical Point";
    }
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFileError(null);
    setMagnetizationData([]);
    setCriticalTemp(null);
    
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setFileError('Please upload a CSV file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        console.log("CSV file content (first 100 chars):", csvText.substring(0, 100) + "...");
        
        // Count the lines and check format before parsing
        const lines = csvText.trim().split('\n');
        console.log(`CSV file has ${lines.length} lines`);
        
        if (lines.length < 3) {
          setFileError('CSV file too small. Need at least 3 lines for a meaningful graph.');
          return;
        }
        
        // Check the first few lines to validate format
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(',');
          if (parts.length < 3) {
            setFileError(`Line ${i+1} has incorrect format. Expected "row,column,value" but found: ${line}`);
            return;
          }
        }
        
        const matrix = parseCSVToAdjacencyMatrix(csvText);
        
        // Validate matrix
        if (!matrix || matrix.length === 0) {
          setFileError('Could not parse the CSV file into a valid adjacency matrix.');
          return;
        }
        
        // Check if matrix is square
        const size = matrix.length;
        console.log(`Parsed adjacency matrix size: ${size}x${size}`);
        
        for (let i = 0; i < size; i++) {
          if (matrix[i].length !== size) {
            setFileError('The adjacency matrix must be square.');
            return;
          }
        }
        
        // Check if matrix is symmetric (undirected graph)
        let isSymmetric = true;
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < i; j++) {
            if (matrix[i][j] !== matrix[j][i]) {
              isSymmetric = false;
              break;
            }
          }
          if (!isSymmetric) break;
        }
        
        if (!isSymmetric) {
          setFileError('Warning: The adjacency matrix is not symmetric. The graph should be undirected for the Ising model. Calculation may produce unexpected results.');
        }
        
        // Initialize with the matrix
        setAdjacencyMatrix(matrix);
        setIsGraphLoaded(true);
        
        // Calculate graph statistics
        const n = matrix.length;
        let edges = 0;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            if (matrix[i][j] !== 0) edges++;
          }
        }
        setGraphStats({ nodes: n, edges });
        
        // Initialize Ising model
        initializeIsingModel();
        
        // For custom uploads, estimate critical temperature
        estimateCriticalTemperature(matrix);
        
      } catch (error) {
        console.error("CSV parsing error:", error);
        setFileError(`Error parsing CSV: ${error.message}`);
      }
    };
    
    reader.onerror = (e) => {
      console.error("FileReader error:", e);
      setFileError("Failed to read the file. Please try again.");
    };
    
    reader.readAsText(file);
  };
  
  // Load example graph types
  const loadExampleGraph = (type) => {
    let matrix = null;
    
    switch (type) {
      case 'grid': {
        // Create a 5x5 square grid
        const size = 5;
        matrix = Array(size * size).fill().map(() => Array(size * size).fill(0));
        
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const index = i * size + j;
            
            // Connect to right neighbor
            if (j < size - 1) {
              matrix[index][index + 1] = 1;
              matrix[index + 1][index] = 1;
            }
            
            // Connect to bottom neighbor
            if (i < size - 1) {
              matrix[index][index + size] = 1;
              matrix[index + size][index] = 1;
            }
          }
        }
        
        // Set known critical temperature
        setCriticalTemp(KNOWN_CRITICAL_TEMPS.grid);
        break;
      }
      case 'triangular': {
        // Create a triangular lattice
        const size = 5;
        matrix = Array(size * size).fill().map(() => Array(size * size).fill(0));
        
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const index = i * size + j;
            
            // Connect to right neighbor
            if (j < size - 1) {
              matrix[index][index + 1] = 1;
              matrix[index + 1][index] = 1;
            }
            
            // Connect to bottom neighbor
            if (i < size - 1) {
              matrix[index][index + size] = 1;
              matrix[index + size][index] = 1;
            }
            
            // Connect diagonally
            if (i < size - 1 && j < size - 1) {
              matrix[index][index + size + 1] = 1;
              matrix[index + size + 1][index] = 1;
            }
          }
        }
        
        // Set known critical temperature
        setCriticalTemp(KNOWN_CRITICAL_TEMPS.triangular);
        break;
      }
      case 'hexagonal': {
        // Create a hexagonal lattice approximation
        const size = 4;
        const totalNodes = size * size * 2; // Two nodes per unit cell
        matrix = Array(totalNodes).fill().map(() => Array(totalNodes).fill(0));
        
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const node1 = (i * size + j) * 2;
            const node2 = node1 + 1;
            
            // Connect nodes within the unit cell
            matrix[node1][node2] = 1;
            matrix[node2][node1] = 1;
            
            // Connect to the right unit cell
            if (j < size - 1) {
              matrix[node2][(i * size + j + 1) * 2] = 1;
              matrix[(i * size + j + 1) * 2][node2] = 1;
            }
            
            // Connect to the bottom unit cell
            if (i < size - 1) {
              matrix[node1][((i + 1) * size + j) * 2 + 1] = 1;
              matrix[((i + 1) * size + j) * 2 + 1][node1] = 1;
            }
          }
        }
        
        // Set known critical temperature
        setCriticalTemp(KNOWN_CRITICAL_TEMPS.hexagonal);
        break;
      }
      default:
        return;
    }
    
    // Initialize with the matrix
    setAdjacencyMatrix(matrix);
    setIsGraphLoaded(true);
    setShowSimulationView(false); // Make sure we're showing the interactive view
    
    // Calculate graph statistics
    const n = matrix.length;
    let edges = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (matrix[i][j] !== 0) edges++;
      }
    }
    setGraphStats({ nodes: n, edges });
    
    // Initialize Ising model
    initializeIsingModel();
    
    // Reset calculation results
    setMagnetizationData([]);
  };
  
  // Estimate critical temperature for a given lattice
  const estimateCriticalTemperature = async (matrix) => {
    // Simplified estimation for quick response
    const model = new IsingModel(matrix);
    const tempPoints = 10;
    const tempMin = 1.0;
    const tempMax = 4.0;
    const tempStep = (tempMax - tempMin) / (tempPoints - 1);
    
    // Measure magnetization at different temperatures
    const results = [];
    for (let i = 0; i < tempPoints; i++) {
      const temp = tempMin + i * tempStep;
      
      // Equilibrate and measure
      model.simulationSteps(temp, 1000);
      model.simulationSteps(temp, 500);
      
      const mag = model.calculateAbsoluteMagnetization();
      results.push({ temperature: temp, magnetization: mag });
    }
    
    // Find the temperature with the steepest drop in magnetization
    let maxSlope = 0;
    let estCritTemp = 2.27; // Default to square lattice value
    
    for (let i = 1; i < results.length; i++) {
      const slope = (results[i-1].magnetization - results[i].magnetization) / 
                   (results[i].temperature - results[i-1].temperature);
      
      if (slope > maxSlope) {
        maxSlope = slope;
        estCritTemp = (results[i-1].temperature + results[i].temperature) / 2;
      }
    }
    
    setCriticalTemp(estCritTemp);
    return estCritTemp;
  };
  
  // Generate temperature points - with advanced adaptive sampling
  const generateTemperaturePoints = (initialEstimate = null) => {
    // If we have an initial Tc estimate from first run and two-stage sampling is enabled
    if (initialEstimate !== null && useTwoStageSampling) {
      console.log(`Using two-stage sampling around initial Tc estimate: ${initialEstimate.toFixed(3)}`);
      
      // Define critical region around the estimated Tc value
      const margin = 0.5; // Temperature margin around Tc
      const criticalRegionMin = Math.max(tempMin, initialEstimate - margin);
      const criticalRegionMax = Math.min(tempMax, initialEstimate + margin);
      
      // Allocate 70% of points to critical region, 30% to full range
      const criticalRegionPoints = Math.max(Math.floor(tempPoints * 0.7), 10);
      const remainingPoints = tempPoints - criticalRegionPoints;
      
      // Determine step sizes
      const critStep = (criticalRegionMax - criticalRegionMin) / (criticalRegionPoints - 1 || 1);
      const lowerStep = (criticalRegionMin - tempMin) / (Math.floor(remainingPoints/2) || 1);
      const upperStep = (tempMax - criticalRegionMax) / (Math.ceil(remainingPoints/2) || 1);
      
      // Generate dense points around critical region
      const critPoints = [];
      for (let i = 0; i < criticalRegionPoints; i++) {
        critPoints.push(parseFloat((criticalRegionMin + i * critStep).toFixed(3)));
      }
      
      // Generate additional points for the lower and upper regions
      const lowerPoints = [];
      if (criticalRegionMin > tempMin && remainingPoints > 0) {
        for (let i = 0; i < Math.floor(remainingPoints/2); i++) {
          lowerPoints.push(parseFloat((tempMin + i * lowerStep).toFixed(3)));
        }
      }
      
      const upperPoints = [];
      if (criticalRegionMax < tempMax && remainingPoints > 0) {
        for (let i = 0; i < Math.ceil(remainingPoints/2); i++) {
          upperPoints.push(parseFloat((criticalRegionMax + i * upperStep).toFixed(3)));
        }
      }
      
      // Combine all points and sort from high to low
      return [...lowerPoints, ...critPoints, ...upperPoints].sort((a, b) => b - a);
    }
    
    // First run or if two-stage sampling is disabled: use linear distribution
    const step = (tempMax - tempMin) / (tempPoints - 1);
    return Array.from({ length: tempPoints }, (_, i) => parseFloat((tempMax - i * step).toFixed(3)));
  };
  
  // Equilibrate and measure magnetization at one temperature
  const calculateMagnetizationAtTemperature = async (temperature, model) => {
    try {
      // Progress update for equilibration phase
      setProgress(prevProgress => prevProgress + 0.1);
      
      // Use standard Metropolis
      console.log(`Using Metropolis algorithm at T=${temperature}`);
      
      // Use user-specified equilibration steps without modification
      const userEquilibrationSteps = equilibrationSteps;
      
      // Run equilibration in chunks to keep UI responsive
      const chunkSize = 2000;
      for (let step = 0; step < userEquilibrationSteps; step += chunkSize) {
        if (abortController.current?.signal.aborted) {
          throw new Error('Calculation aborted');
        }
        
        const stepsToRun = Math.min(chunkSize, userEquilibrationSteps - step);
        model.simulationSteps(temperature, stepsToRun);
        
        // Allow UI to update
        await new Promise(r => setTimeout(r, 0));
      }
      
      // Measurement phase
      const magnetizationValues = [];
      const energyValues = [];
      
      // Take measurements with the specified steps between them
      for (let m = 0; m < measurementTrials; m++) {
        // Run simulation steps between measurements
        model.simulationSteps(temperature, measurementSteps);
        
        // Record measurements
        magnetizationValues.push(model.calculateAbsoluteMagnetization());
        
        // Record energy per spin
        energyValues.push(model.energy / model.numNodes);
        
        // Allow cancellation during measurement
        if (abortController.current?.signal.aborted) {
          throw new Error('Calculation aborted');
        }
      }
      
      // Calculate statistics from measurements
      console.log(`Collected ${magnetizationValues.length} measurements at T=${temperature.toFixed(3)}`);
      
      // Calculate mean magnetization and standard deviation
      const meanMag = magnetizationValues.reduce((sum, val) => sum + val, 0) / magnetizationValues.length;
      
      // Calculate standard deviation
      const squaredDiffs = magnetizationValues.map(val => (val - meanMag) ** 2);
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / magnetizationValues.length;
      const stdDev = Math.sqrt(variance);
      
      // Calculate energy average if available
      const meanEnergy = energyValues.length > 0 ? 
                        energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length : 
                        null;
      
      return { 
        mean: meanMag, 
        stdDev: stdDev,
        errorHigh: meanMag + stdDev,
        errorLow: Math.max(0, meanMag - stdDev),
        energy: meanEnergy
      };
    } catch (error) {
      console.error(`Error at temperature ${temperature}:`, error);
      throw error;
    }
  };
  
  // Start the calculation - with two-stage sampling support
  const startCalculation = async () => {
    if (isCalculating || !adjacencyMatrix) return;
    
    try {
      setIsCalculating(true);
      setProgress(0);
      
      // Stop real-time simulation if running
      if (isRealTimeSimulating) {
        toggleRealTimeSimulation();
      }
      
      // If we're doing a second run in two-stage sampling, keep the data from first run
      if (!firstRunComplete || !useTwoStageSampling) {
        setMagnetizationData([]);
        setCriticalTemp(null);
      }
      
      // Create new abort controller
      abortController.current = new AbortController();
      
      const startTime = Date.now();
      
      // Generate temperature points, possibly based on first run results
      const temperatures = generateTemperaturePoints(
        firstRunComplete && useTwoStageSampling ? initialTcEstimate : null
      );
      
      const results = [];
      if (firstRunComplete && useTwoStageSampling) {
        // If this is second run, use existing data as initial results
        results.push(...magnetizationData);
      }
      
      // First check if the matrix is valid for Ising model calculations
      const matrixSize = adjacencyMatrix.length;
      
      // Check for potential issues with the adjacency matrix
      if (matrixSize === 0) {
        throw new Error("Empty adjacency matrix");
      }
      
      // Create a new Ising model
      console.log("Creating Ising model with matrix size:", matrixSize);
      const model = new IsingModel(adjacencyMatrix);
      
      // Start with random spins at high temperature
      model.state = Array(model.numNodes).fill().map(() => Math.random() < 0.5 ? 1 : -1);
      model.energy = model.calculateTotalEnergy();
      
      // Calculate magnetization at each temperature
      for (let i = 0; i < temperatures.length; i++) {
        if (abortController.current?.signal.aborted) {
          break;
        }
        
        const temp = temperatures[i];
        
        // Skip temperatures we already calculated in first run
        if (firstRunComplete && useTwoStageSampling && 
            magnetizationData.some(d => Math.abs(d.temperature - temp) < 0.01)) {
          console.log(`Skipping already calculated temperature T=${temp}`);
          continue;
        }
        
        // Update progress
        setProgress((i / temperatures.length) * 100);
        console.log(`Processing temperature ${temp} (${i+1}/${temperatures.length})`);
        
        const { mean: magnetization, stdDev, errorHigh, errorLow, energy } = 
          await calculateMagnetizationAtTemperature(temp, model);
        
        console.log(`Results for T=${temp}: mag=${magnetization.toFixed(4)}, stdDev=${stdDev.toFixed(4)}`);
        
        // Add data point
        const result = {
          temperature: temp,
          magnetization: magnetization,
          stdDev: stdDev,
          errorHigh: errorHigh,
          errorLow: errorLow
        };
        
        // Only add optional measurements if they exist
        if (energy !== null && energy !== undefined) {
          result.energy = energy;
        }
        
        results.push(result);
        
        // Sort results by temperature for clean display
        const sortedResults = [...results].sort((a, b) => a.temperature - b.temperature);
        setMagnetizationData(sortedResults);
        
        // Small delay to allow UI updates
        await new Promise(r => setTimeout(r, 10));
      }
      
      // Estimate critical temperature (if enough data points)
      if (results.length > 5) {
        const critTempResult = estimateCriticalTemperatureFromData(results);
        setCriticalTemp(critTempResult.value);
        
        // If this is the first run and we're using two-stage sampling,
        // save the estimate for the second run
        if (!firstRunComplete && useTwoStageSampling) {
          setInitialTcEstimate(critTempResult.value);
          setFirstRunComplete(true);
        }
      }
      
      const endTime = Date.now();
      setCalculationTime((endTime - startTime) / 1000);
    } catch (error) {
      console.error('Calculation error:', error);
      setFileError(`Calculation failed: ${error.message}`);
    } finally {
      setIsCalculating(false);
      
      // If this was the first run of two-stage sampling, automatically start second run
      if (firstRunComplete && useTwoStageSampling && initialTcEstimate !== null) {
        // This was already the second run, reset the flags
        setFirstRunComplete(false);
        setInitialTcEstimate(null);
      } else if (!firstRunComplete && useTwoStageSampling && initialTcEstimate !== null) {
        // This was the first run, indicate to the user that a second run is about to start
        const continueSecondRun = true; // For automatic continuation
        if (continueSecondRun) {
          console.log("Starting second run with focused temperature sampling...");
          // Small delay before starting second run
          setTimeout(() => {
            startCalculation();
          }, 1000);
        }
      }
    }
  };
  
  // Stop the calculation
  const stopCalculation = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
  };
  
  // Estimate critical temperature from the magnetization data
  const estimateCriticalTemperatureFromData = (data) => {
    // Make a copy of data and ensure it's sorted by temperature (from low to high)
    const sortedData = [...data].sort((a, b) => a.temperature - b.temperature);
    
    // Apply a moving average smoothing to magnetization data first
    // This helps reduce noise that can affect derivative calculation
    const smoothedData = [];
    const windowSize = 3; // Size of the moving average window
    
    for (let i = 0; i < sortedData.length; i++) {
      if (i < windowSize/2 || i >= sortedData.length - windowSize/2) {
        // For points at the edges, just copy the original data
        smoothedData.push({...sortedData[i]});
      } else {
        // For interior points, apply moving average
        let sumMag = 0;
        for (let j = -Math.floor(windowSize/2); j <= Math.floor(windowSize/2); j++) {
          sumMag += sortedData[i + j].magnetization;
        }
        const avgMag = sumMag / windowSize;
        smoothedData.push({
          ...sortedData[i], 
          magnetization: avgMag
        });
      }
    }
    
    // Calculate numerical derivative of magnetization with respect to temperature
    // using the smoothed data
    const derivatives = [];
    for (let i = 1; i < smoothedData.length; i++) {
      // Calculate negative slope since magnetization decreases with increasing temperature
      const slope = (smoothedData[i-1].magnetization - smoothedData[i].magnetization) / 
                   (smoothedData[i].temperature - smoothedData[i-1].temperature);
      
      const midTemp = (smoothedData[i-1].temperature + smoothedData[i].temperature) / 2;
      derivatives.push({
        temperature: midTemp,
        slope: slope,
        // Store original data indices for reference
        leftIndex: i-1,
        rightIndex: i
      });
    }
    
    // Find the temperature with the maximum slope (steepest change)
    let maxSlope = 0;
    let critTemp = null;
    let critTempIndex = -1;
    
    for (let i = 0; i < derivatives.length; i++) {
      if (derivatives[i].slope > maxSlope) {
        maxSlope = derivatives[i].slope;
        critTemp = derivatives[i].temperature;
        critTempIndex = i;
      }
    }
    
    // Enhanced algorithm: Apply cubic spline interpolation for better localization
    // of the maximum slope
    if (critTempIndex >= 1 && critTempIndex < derivatives.length - 1) {
      // Take 3 points around the maximum and fit a quadratic function
      const x = [
        derivatives[critTempIndex - 1].temperature,
        derivatives[critTempIndex].temperature,
        derivatives[critTempIndex + 1].temperature
      ];
      const y = [
        derivatives[critTempIndex - 1].slope,
        derivatives[critTempIndex].slope,
        derivatives[critTempIndex + 1].slope
      ];
      
      try {
        // Fit a quadratic function ax^2 + bx + c
        // When we have 3 points, we can solve the system of equations exactly
        const x0_2 = x[0] * x[0];
        const x1_2 = x[1] * x[1];
        const x2_2 = x[2] * x[2];
        
        const det = (x0_2 * (x[1] - x[2])) - (x[0] * (x1_2 - x2_2)) + (x1_2 * x[2] - x2_2 * x[1]);
        
        if (det !== 0) {
          const a = ((y[0] * (x[1] - x[2])) - (x[0] * (y[1] - y[2])) + (y[1] * x[2] - y[2] * x[1])) / det;
          const b = ((x0_2 * (y[1] - y[2])) - (y[0] * (x1_2 - x2_2)) + (x1_2 * y[2] - x2_2 * y[1])) / det;
          const c = ((x0_2 * (x[1] * y[2] - x[2] * y[1])) - (x[0] * (x1_2 * y[2] - x2_2 * y[1])) + (y[0] * (x1_2 * x[2] - x2_2 * x[1]))) / det;
          
          // If 'a' is negative, this is a maximum, and we can find the exact x value
          if (a < 0) {
            // Maximum of a quadratic occurs at x = -b/(2a)
            const maxX = -b / (2 * a);
            
            // Only use this refined value if it's within the temperature range we studied
            if (maxX >= tempMin && maxX <= tempMax) {
              critTemp = maxX;
            }
          }
        }
      } catch (e) {
        console.error("Error in quadratic interpolation:", e);
      }
    }
    
    // Estimate uncertainty in critical temperature
    let critTempError = 0;
    
    // Method: Use the width of the peak in the derivative
    if (critTempIndex >= 0 && critTempIndex < derivatives.length) {
      const halfMaxSlope = maxSlope / 2;
      
      // Look left until we find slope < halfMaxSlope
      let leftIndex = critTempIndex;
      while (leftIndex > 0 && derivatives[leftIndex].slope > halfMaxSlope) {
        leftIndex--;
      }
      
      // Look right until we find slope < halfMaxSlope
      let rightIndex = critTempIndex;
      while (rightIndex < derivatives.length - 1 && derivatives[rightIndex].slope > halfMaxSlope) {
        rightIndex++;
      }
      
      // Use the width of the half-maximum as uncertainty estimate
      if (rightIndex > leftIndex) {
        const tempRange = derivatives[rightIndex].temperature - derivatives[leftIndex].temperature;
        critTempError = tempRange / 2;
      } else {
        // Fallback method: use average temperature spacing
        critTempError = (tempMax - tempMin) / tempPoints;
      }
    } else {
      // If something went wrong, use a default error of 5% of Tc
      critTempError = critTemp ? critTemp * 0.05 : 0.1;
    }
    
    // Ensure reasonable error bounds
    critTempError = Math.max(0.02, Math.min(critTempError, 0.2));
    
    return { value: critTemp, error: critTempError };
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);
  
  // Load default graph on initial render
  useEffect(() => {
    if (!isGraphLoaded) {
      loadExampleGraph('grid');
    }
  }, []);
  
  return (
    <div className="flex flex-col w-full bg-white p-4 rounded-lg">
      <div className="text-xl font-bold mb-4 text-center">Ising Model on Arbitrary Graphs</div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Lattice selection and custom upload */}
        <div className="bg-gray-100 p-3 rounded-lg w-full">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h3 className="font-bold mb-2">Select Lattice Type</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadExampleGraph('grid')}
                  className="p-2 border rounded bg-blue-500 text-white hover:bg-blue-600 flex-1"
                  disabled={isCalculating}
                >
                  Square Grid
                </button>
                <button
                  onClick={() => loadExampleGraph('triangular')}
                  className="p-2 border rounded bg-blue-500 text-white hover:bg-blue-600 flex-1"
                  disabled={isCalculating}
                >
                  Triangular
                </button>
                <button
                  onClick={() => loadExampleGraph('hexagonal')}
                  className="p-2 border rounded bg-blue-500 text-white hover:bg-blue-600 flex-1"
                  disabled={isCalculating}
                >
                  Hexagonal
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold mb-2">Upload Custom Matrix</h3>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="border p-2 w-full"
                disabled={isCalculating}
              />
              <div className="text-xs text-gray-500 mt-1">
                CSV format: row,column,value (Mathematica sparse array format)
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error display area */}
      {fileError && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {fileError}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setFileError(null)}
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}
      
      {/* Graph preview and stats with dual view */}
      {isGraphLoaded && (
        <div className="bg-gray-100 p-3 rounded-lg mb-4">
          <div className="flex flex-col gap-4">
            <div className="w-full bg-white rounded shadow-md">
              {!showSimulationView ? (
                <GraphPreview 
                  adjacencyMatrix={adjacencyMatrix}
                  spins={spins}
                  onSvgRef={handleSvgRef}
                />
              ) : (
                <StaticIsingView 
                  adjacencyMatrix={adjacencyMatrix}
                  spins={spins}
                  positions={nodePositions}
                />
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-white rounded">
              <div><span className="font-semibold">Nodes:</span> {graphStats.nodes}</div>
              <div><span className="font-semibold">Edges:</span> {graphStats.edges}</div>
              <div><span className="font-semibold">Average Degree:</span> {(2 * graphStats.edges / graphStats.nodes).toFixed(2)}</div>
              <div><span className="font-semibold">Connectivity:</span> {(graphStats.edges / (graphStats.nodes * (graphStats.nodes - 1) / 2) * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Real-time Ising model controls */}
      {isGraphLoaded && (
        <div className="bg-gray-100 p-3 rounded-lg mb-4">
          <h3 className="font-bold mb-2">Real-time Ising Model Simulation</h3>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Temperature Control</h4>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="0.5" 
                  max="5.0" 
                  step="0.1" 
                  value={simulationTemp}
                  onChange={handleSimulationTempChange}
                  className="w-full"
                  disabled={isCalculating}
                />
                <span className="font-bold text-lg w-16 text-right">{simulationTemp.toFixed(1)}</span>
              </div>
              <div className="text-xs text-gray-600 flex justify-between mt-1">
                <span>Cold (Ordered)</span>
                <span>Hot (Disordered)</span>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-1">Time Scale</h4>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="50" 
                    max="500" 
                    step="10" 
                    value={timeScale}
                    onChange={handleTimeScaleChange}
                    className="w-full"
                    disabled={isCalculating}
                  />
                  <span className="font-bold text-lg w-16 text-right">{timeScale}</span>
                </div>
                <div className="text-xs text-gray-600 flex justify-between mt-1">
                  <span>Slower</span>
                  <span>Faster</span>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="text-sm">
                  <span className="font-semibold">Critical Temperature:</span> {criticalTemp ? criticalTemp.toFixed(2) : "Estimating..."}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Current Phase:</span> {getPhaseDescription()}
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Simulation Statistics</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm"><span className="font-semibold">Magnetization:</span> {magnetization.toFixed(3)}</div>
                <div className="text-sm"><span className="font-semibold">|Magnetization|:</span> {absoluteMagnetization.toFixed(3)}</div>
                <div className="text-sm"><span className="font-semibold">Energy:</span> {energy.toFixed(3)}</div>
                <div className="text-sm"><span className="font-semibold">Energy per Site:</span> {(energy / (graphStats.nodes || 1)).toFixed(3)}</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <button
              onClick={toggleRealTimeSimulation}
              className={`px-4 py-2 font-bold text-white rounded ${isRealTimeSimulating ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              disabled={isCalculating}
            >
              {isRealTimeSimulating ? 'Stop Simulation' : 'Simulate Magnet'}
            </button>
            
            <button
              onClick={resetSpins}
              className="px-4 py-2 font-bold bg-yellow-500 text-white rounded hover:bg-yellow-600"
              disabled={isCalculating}
            >
              Randomize Spins
            </button>
            
            <button
              onClick={() => setAllSpins(1)}
              className="px-4 py-2 font-bold bg-black text-white rounded hover:bg-gray-800"
              disabled={isCalculating}
            >
              All Up (Black)
            </button>
            
            <button
              onClick={() => setAllSpins(-1)}
              className="px-4 py-2 font-bold bg-white text-black border-2 border-black rounded hover:bg-gray-100"
              disabled={isCalculating}
            >
              All Down (White)
            </button>
          </div>
        </div>
      )}
      
      {/* Temperature and Monte Carlo parameters */}
      <div className="bg-gray-100 p-3 rounded-lg mb-4">
        <h3 className="font-bold mb-2">Magnetization Curve Calculation</h3>
        
        <div className="mb-3">
          <h4 className="font-semibold mb-1">Temperature Range</h4>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min="0.1" 
              max="5" 
              step="0.1" 
              value={tempMin}
              onChange={(e) => setTempMin(parseFloat(e.target.value))}
              className="p-2 border rounded w-20"
              disabled={isCalculating}
            />
            <span>to</span>
            <input 
              type="number" 
              min="0.5"
              max="10" 
              step="0.1" 
              value={tempMax}
              onChange={(e) => setTempMax(parseFloat(e.target.value))}
              className="p-2 border rounded w-20"
              disabled={isCalculating}
            />
            <span className="ml-4">Points:</span>
            <input 
              type="number" 
              min="5" 
              max="50" 
              step="1" 
              value={tempPoints}
              onChange={(e) => setTempPoints(parseInt(e.target.value))}
              className="p-2 border rounded w-20"
              disabled={isCalculating}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-1">Equilibration Steps:</h4>
            <input 
              type="number" 
              min="1000" 
              max="100000" 
              step="1000" 
              value={equilibrationSteps}
              onChange={(e) => setEquilibrationSteps(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              disabled={isCalculating}
            />
            <div className="text-xs text-gray-500 mt-1">
              Steps to reach equilibrium (higher = more accurate, slower calculation)
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Measurement Steps:</h4>
            <input 
              type="number" 
              min="100" 
              max="20000" 
              step="100" 
              value={measurementSteps}
              onChange={(e) => setMeasurementSteps(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              disabled={isCalculating}
            />
            <div className="text-xs text-gray-500 mt-1">
              Steps between measurements (higher = better decorrelation)
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-1">Measurement Trials:</h4>
            <input 
              type="number" 
              min="10" 
              max="1000" 
              step="10" 
              value={measurementTrials}
              onChange={(e) => setMeasurementTrials(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              disabled={isCalculating}
            />
            <div className="text-xs text-gray-500 mt-1">
              Number of measurements averaged per temperature point
            </div>
          </div>
        </div>
      </div>
      
      {/* Calculation control */}
      <div className="flex justify-center mb-4">
        {!isCalculating ? (
          <button
            onClick={startCalculation}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!isGraphLoaded || isRealTimeSimulating}
          >
            Calculate Magnetization Curve
          </button>
        ) : (
          <button
            onClick={stopCalculation}
            className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Stop Calculation
          </button>
        )}
      </div>
      
      {/* Progress bar */}
      {isCalculating && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-center mt-2">
            Calculating... {Math.round(progress)}% complete
            {firstRunComplete && useTwoStageSampling && initialTcEstimate && (
              <span> (refining around Tc≈{initialTcEstimate.toFixed(2)})</span>
            )}
          </div>
        </div>
      )}
      
      {/* Results graph */}
      {magnetizationData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="font-bold mb-3">Magnetization vs Temperature</h3>
          
          {criticalTemp && (
            <div className="mb-3 p-2 bg-yellow-100 rounded">
              <span>Estimated critical temperature: T<sub>c</sub> = {criticalTemp.toFixed(2)} ± {criticalTemp ? "0.05" : "?"}</span>
            </div>
          )}
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={magnetizationData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="temperature" 
                  type="number"
                >
                  <Label value="Temperature (T)" position="bottom" offset={10} />
                </XAxis>
                <YAxis domain={[0, 1.05]}>
                  <Label value="Magnetization |M|" position="left" angle={-90} offset={-10} />
                </YAxis>
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "magnetization") return [value.toFixed(4), 'Magnetization'];
                    if (name === "energy") return [value.toFixed(4), 'Energy per Spin'];
                    if (name === "stdDev") return [value.toFixed(4), 'Standard Deviation'];
                    return [value, name];
                  }}
                  labelFormatter={(value) => `Temperature: ${value}`}
                />
                
                {/* Magnetization curve */}
                <Line 
                  type="monotone" 
                  dataKey="magnetization" 
                  stroke="#8884d8" 
                  dot={{ r: 4 }} 
                  isAnimationActive={false}
                  connectNulls={false}
                />
                
                {/* Critical temperature line */}
                {criticalTemp && (
                  <ReferenceLine
                    x={criticalTemp}
                    stroke="red"
                    strokeDasharray="5 5"
                    label={{ 
                      value: `Tc = ${criticalTemp.toFixed(2)}`,
                      position: 'top',
                      fill: 'red'
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {calculationTime > 0 && (
            <div className="text-sm text-gray-600 text-right mt-2">
              Calculation time: {calculationTime.toFixed(1)} seconds
            </div>
          )}
        </div>
      )}
      
      {/* Information */}
      <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
        <h3 className="font-bold mb-2">About the Ising Model</h3>
        <p>
          This tool combines interactive real-time simulation with quantitative magnetization curve calculation
          for the Ising model on arbitrary graph structures. The Ising model is a mathematical model of 
          ferromagnetism in statistical mechanics.
        </p>
        <p className="mt-2">
          <strong>Controls:</strong>
        </p>
        <ul className="list-disc pl-5 mt-1">
          <li><strong>Simulate Magnet</strong> - Run real-time Monte Carlo simulation at current temperature</li>
          <li><strong>Time Scale</strong> - Control simulation speed (50-500 Monte Carlo steps per frame)</li>
          <li><strong>Calculate Magnetization Curve</strong> - Generate full magnetization vs. temperature curve</li>
        </ul>
        <p className="mt-2">
          <strong>Known theoretical values:</strong> Square lattice Tc ≈ 2.27, Triangular lattice Tc ≈ 3.64, Hexagonal lattice Tc ≈ 1.52.
        </p>
      </div>
    </div>
  );
}

export default MagnetizationCalculator;
// Add at the end of Working_Ising.jsx
document.addEventListener('DOMContentLoaded', function() {
  const rootElement = document.getElementById('react-root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<MagnetizationCalculator />);
  } else {
    console.error("Could not find #react-root element");
  }
});
