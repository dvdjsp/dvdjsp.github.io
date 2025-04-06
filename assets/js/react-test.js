// React test using vanilla JavaScript (no JSX)
document.addEventListener('DOMContentLoaded', function() {
  console.log("React test script loaded!");
  
  // Check if React is loaded
  if (!window.React || !window.ReactDOM) {
    console.error("React libraries missing!");
    document.getElementById('react-container').innerHTML = 
      '<div style="color:red;border:1px solid red;padding:10px">React libraries not loaded!</div>';
    return;
  }
  
  // Simple React Counter component (no JSX)
  function Counter() {
    const [count, setCount] = React.useState(0);
    
    return React.createElement(
      'div', 
      {style: {border: '2px solid blue', padding: '20px', backgroundColor: '#f0f8ff'}},
      React.createElement('h2', null, 'React is Working!'),
      React.createElement('p', null, 'Count: ', count),
      React.createElement(
        'button',
        {
          onClick: () => setCount(count + 1),
          style: {
            padding: '8px 16px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px'
          }
        },
        'Click me'
      )
    );
  }
  
  // Render the React component
  try {
    const container = document.getElementById('react-container');
    if (container) {
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(Counter, null));
      console.log("React component rendered successfully!");
    } else {
      console.error("Could not find #react-container element");
    }
  } catch (e) {
    console.error("Error rendering React component:", e);
  }
});
