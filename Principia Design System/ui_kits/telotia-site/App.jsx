function App() {
  return (
    <div className="tel-page">
      <Nav/>
      <Hero/>
      <Organism/>
      <Vocabulary/>
      <Install/>
      <Assessment/>
      <Footer/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
