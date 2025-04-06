function YourComponent() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <h2>My React Component</h2>
      <p>Counter: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

// Render the component
ReactDOM.createRoot(document.getElementById('react-root')).render(<YourComponent />);
