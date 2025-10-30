import React, { useEffect, useState } from "react";
import neo4j from "neo4j-driver";
import { BasicNvlWrapper } from "@neo4j-nvl/react";

const GraphExplorer = () => {
    const [nodes, setNodes] = useState([]);
    const [rels, setRels] = useState([]);

    useEffect(() => {
        const fetchGraph = async () => {
            const driver = neo4j.driver(
                process.env.REACT_APP_NEO4J_URI,
                neo4j.auth.basic(
                    process.env.REACT_APP_NEO4J_USERNAME,
                    process.env.REACT_APP_NEO4J_PASSWORD
                )
            );

            const session = driver.session();
            try {
                // Fetch part of your PKP graph
                const result = await session.run(`
          MATCH (a)-[r]->(b)
          RETURN a, r, b
          LIMIT 50
        `);

                const nodeMap = new Map();
                const relationships = [];

                result.records.forEach(record => {
                    const a = record.get("a");
                    const b = record.get("b");
                    const r = record.get("r");

                    nodeMap.set(a.identity.toString(), {
                        id: a.identity.toString(),
                        label: a.labels[0],
                        properties: a.properties
                    });
                    nodeMap.set(b.identity.toString(), {
                        id: b.identity.toString(),
                        label: b.labels[0],
                        properties: b.properties
                    });

                    relationships.push({
                        id: r.identity.toString(),
                        from: a.identity.toString(),
                        to: b.identity.toString(),
                        type: r.type
                    });
                });

                setNodes(Array.from(nodeMap.values()));
                setRels(relationships);
            } catch (err) {
                console.error("Error fetching graph:", err);
            } finally {
                await session.close();
                await driver.close();
            }
        };

        fetchGraph();
    }, []);

    return (
        <div style={{ width: "100%", height: "90vh", background: "#f9fafb" }}>
            <BasicNvlWrapper
                nodes={nodes}
                rels={rels}
                nvlOptions={{ initialZoom: 1.2 }}
                nvlCallbacks={{
                    onLayoutDone: () => console.log("Layout done"),
                }}
            />
        </div>
    );
};

export default GraphExplorer;
