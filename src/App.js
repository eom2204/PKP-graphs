import React from "react";
import GraphExplorer from "./GraphExplorer";

function App() {
  return (
      <div>
        <h2 style={{ textAlign: "center", margin: "20px 0" }}>
          Neo4j PKP Graph Explorer
        </h2>
        <GraphExplorer />
      </div>
  );
}

export default App;
