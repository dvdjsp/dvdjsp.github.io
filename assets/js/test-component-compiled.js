window.onload = function() {
  // Check if React is loaded
  if (!window.React || !window.ReactDOM) {
    console.error("React or ReactDOM not loaded!");
    document.getElementById('react-root').innerHTML = 
      '<div style="color:red;border:1px solid red;padding:10px">React libraries not loaded!</div>';
    return;
  }
  
  // Simple counter using plain React.createElement (no JSX)
  function Counter() {
    const [count, setCount] = React.useState(0);
    
    return React.createElement(
      'div', 
      {style: {border: '2px solid blue', padding: '20px'}},
      React.createElement('h2', null, 'React Test Component'),
      React.createElement('p', null, 'Count: ', count),
      React.createElement(
        'button',
        {onClick: () => setCount(count + 1), style: {padding: '5px 10px'}},
        'Click me'
      )
    );
  }
  
  // Try to render with both methods
  try {
    // React 18 method
    const root = ReactDOM.createRoot(document.getElementById('react-root'));
    root.render(React.createElement(Counter));
    console.log("Component rendered successfully");
  } catch (e) {
    console.error("Render error:", e);
    
    // Fallback to older method
    try {
      ReactDOM.render(
        React.createElement(Counter),
        document.getElementById('react-root')
      );
    } catch (e2) {
      document.getElementById('react-root').innerHTML = 
        '<div style="color:red;border:1px solid red;padding:10px">Error: ' + e.message + '</div>';
    }
  }
};
