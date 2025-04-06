// Create a file called test-component.jsx in assets/js
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

document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.createRoot(document.getElementById('react-root')).render(<TestComponent />);
});
