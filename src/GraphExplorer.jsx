import React, { useEffect, useState } from "react";
import neo4j from "neo4j-driver";
import { InteractiveNvlWrapper } from "@neo4j-nvl/react";

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
                const result = await session.run(`
          MATCH (a)-[r]->(b)
          RETURN a, r, b
          LIMIT 50
        `);

                const nodeMap = new Map();
                const relationships = [];

                result.records.forEach((record) => {
                    const a = record.get("a");
                    const b = record.get("b");
                    const r = record.get("r");

                    nodeMap.set(a.identity.toString(), {
                        id: a.identity.toString(),
                        label: a.labels[0],
                        size: 30,
                        color: "#ffc107",
                        properties: a.properties,
                    });

                    nodeMap.set(b.identity.toString(), {
                        id: b.identity.toString(),
                        label: b.labels[0],
                        size: 30,
                        color: "#42a5f5",
                        properties: b.properties,
                    });

                    relationships.push({
                        id: r.identity.toString(),
                        from: a.identity.toString(),
                        to: b.identity.toString(),
                        type: r.type,
                    });
                });

                setNodes(Array.from(nodeMap.values()));
                setRels(relationships);

                console.log("Fetched", result.records.length, "records from Aura");
            } catch (err) {
                console.error("Error fetching graph:", err);
            } finally {
                await session.close();
                await driver.close();
            }
        };

        fetchGraph();
    }, []);

    const mouseEventCallbacks = {
        onNodeClick: (node, hitTargets, evt) => {
            console.log("Node clicked:", node);
            alert(`Node clicked:\nLabel: ${node.label}\nID: ${node.id}`);
        },
        onRelationshipClick: (rel, hitTargets, evt) => {
            console.log("Relationship clicked:", rel);
        },
        onZoom: (zoomLevel) => {
            console.log("Zoom level:", zoomLevel);
        },
        onPan: () => console.log("Panning graph..."),
    };

    return (
        <div style={{ width: "100%", height: "90vh", background: "#f9fafb" }}>
            <InteractiveNvlWrapper
                nodes={nodes}
                rels={rels}
                mouseEventCallbacks={mouseEventCallbacks}
            />
        </div>
    );
};

export default GraphExplorer;
