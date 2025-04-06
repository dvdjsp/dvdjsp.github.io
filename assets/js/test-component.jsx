function TestComponent() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{border: '2px solid blue', padding: '20px', margin: '20px'}}>
      <h2>React Test Component</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}

// Make sure this executes after the page is loaded
window.onload = function() {
  // Try both methods of rendering
  try {
    // Method 1: New React 18 way
    const root = ReactDOM.createRoot(document.getElementById('react-root'));
    root.render(React.createElement(TestComponent));
    console.log("Rendered with createRoot");
  } catch (e) {
    console.error("createRoot failed:", e);
    
    // Method 2: Fallback to older React way
    try {
      ReactDOM.render(
        React.createElement(TestComponent), 
        document.getElementById('react-root')
      );
      console.log("Rendered with legacy render");
    } catch (e2) {
      console.error("Legacy render also failed:", e2);
      
      // Method 3: Ultimate fallback - just put something in the div
      document.getElementById('react-root').innerHTML = 
        '<div style="border: 2px solid red; padding: 20px;">React failed to render. Check console for errors.</div>';
    }
  }
};
