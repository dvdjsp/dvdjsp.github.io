// Simple vanilla JavaScript that doesn't rely on React
document.addEventListener('DOMContentLoaded', function() {
  // Get the div
  var rootDiv = document.getElementById('react-root');
  
  if (!rootDiv) {
    console.error("Could not find element with ID 'react-root'");
    return;
  }
  
  // Add some content with pure DOM API
  rootDiv.innerHTML = `
    <div style="border: 2px solid blue; padding: 20px; background-color: #f0f8ff;">
      <h2>JavaScript is Working!</h2>
      <p id="counter">Count: 0</p>
      <button id="increment-btn" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px;">
        Click me
      </button>
    </div>
  `;
  
  // Add click functionality
  var count = 0;
  var counterElement = document.getElementById('counter');
  var button = document.getElementById('increment-btn');
  
  if (button && counterElement) {
    button.addEventListener('click', function() {
      count++;
      counterElement.textContent = 'Count: ' + count;
    });
  }
  
  // Write directly to page that it worked
  rootDiv.appendChild(document.createElement('p')).textContent = 
    'JavaScript file loaded successfully at: ' + new Date().toLocaleTimeString();
});
