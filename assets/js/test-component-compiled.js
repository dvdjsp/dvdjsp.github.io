// Create a simple React counter component
document.addEventListener('DOMContentLoaded', function() {
  console.log("Test Component JS loaded!");
  
  if (!window.React || !window.ReactDOM) {
    console.error("React libraries not found!");
    document.getElementById('react-root').innerHTML = '<div style="color:red;padding:20px;border:1px solid red;">Error: React libraries not loaded</div>';
    return;
  }
  
  // Define a simple counter component
  function Counter() {
    const [count, setCount] = React.useState(0);
    
    return React.createElement(
      'div', 
      {style: {border: '2px solid blue', padding: '20px', margin: '10px'}},
      React.createElement('h2', null, 'React Counter Test'),
      React.createElement('p', null, 'You clicked ', count, ' times'),
      React.createElement(
        'button',
        {
          onClick: () => setCount(count + 1),
          style: {padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px'}
        },
        'Click me'
      )
    );
  }

  try {
    const rootElement = document.getElementById('react-root');
    if (rootElement) {
      ReactDOM.createRoot(rootElement).render(React.createElement(Counter, null));
      console.log("React component rendered successfully!");
    } else {
      console.error("Could not find #react-root element");
    }
  } catch (e) {
    console.error("Error rendering React component:", e);
  }
});
