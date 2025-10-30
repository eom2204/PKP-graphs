import React, {useEffect, useRef, useState} from "react";
import neo4j from "neo4j-driver";
import {InteractiveNvlWrapper} from "@neo4j-nvl/react";

const GraphExplorer = () => {
    const [nodes, setNodes] = useState([]);
    const [rels, setRels] = useState([]);
    const [limit, setLimit] = useState(50);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({x: 0, y: 0});
    const wrapperRef = useRef();

    const fetchGraph = async (limitValue) => {
        const driver = neo4j.driver(
            process.env.REACT_APP_NEO4J_URI,
            neo4j.auth.basic(
                process.env.REACT_APP_NEO4J_USERNAME,
                process.env.REACT_APP_NEO4J_PASSWORD
            )
        );

        const session = driver.session();
        try {
            const result = await session.run(
                `
        MATCH (a)-[r]->(b)
        RETURN a, r, b
        LIMIT $limit
        `,
                {limit: neo4j.int(limitValue)}
            );

            const nodeMap = new Map();
            const relationships = [];

            result.records.forEach((record) => {
                const a = record.get("a");
                const b = record.get("b");
                const r = record.get("r");

                nodeMap.set(a.identity.toString(), {
                    id: a.identity.toString(),
                    label: a.labels[0],
                    properties: a.properties,
                });
                nodeMap.set(b.identity.toString(), {
                    id: b.identity.toString(),
                    label: b.labels[0],
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
        } catch (err) {
            console.error("Error fetching graph:", err);
        } finally {
            await session.close();
            await driver.close();
        }
    };

    useEffect(() => {
        fetchGraph(limit);
    }, [limit]);

    const mouseEventCallbacks = {
        onNodeClick: (node, hitTargets, evt) => {
            setSelectedNode(node);
            setSelectedNodeId(node.id);
            setTooltipPos({x: evt.pageX, y: evt.pageY});
        },
        onZoom: true,
        onPan: true,
    };

    const styledNodes = nodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
        color: n.id === selectedNodeId ? "#ee9878" : "#f4e216",
    }));

    return (
        <div style={{width: "100%", height: "100%", position: "fixed"}}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "10px",
                    marginBottom: "10px",
                    alignItems: "center",
                }}
            >
                <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value || "0", 10))}
                    style={{
                        width: "80px",
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                    }}
                />
                <button
                    onClick={() => fetchGraph(limit)}
                    style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "#6969cc",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Load Graph
                </button>
            </div>

            <div
                ref={wrapperRef}
                style={{
                    width: "100%",
                    height: "calc(100vh - 80px)",
                    borderTop: "1px solid #ddd",
                    overflow: "hidden",
                    cursor: "pointer",
                }}
            >
                <InteractiveNvlWrapper
                    nodes={styledNodes}
                    rels={rels}
                    mouseEventCallbacks={mouseEventCallbacks}
                    nvlOptions={{
                        autoZoom: false,
                        zoomFitPadding: 0,
                    }}
                />

                {selectedNode && (
                    <div
                        style={{
                            position: "absolute",
                            left: tooltipPos.x + 10,
                            top: tooltipPos.y + 10,
                            background: "white",
                            padding: "10px 14px",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            zIndex: 10,
                            minWidth: "180px",
                        }}
                    >
                        <strong>{selectedNode.label}</strong>
                        <ul style={{marginTop: "6px", fontSize: "13px", paddingLeft: "16px"}}>
                            {Object.entries(selectedNode.properties)
                                .filter(([key, value]) => !key.toLowerCase().includes("embedding"))
                                .map(([key, value]) => (
                                <li key={key}>
                                    {key}: <em>{value.toString()}</em>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setSelectedNode(null)}
                            style={{
                                marginTop: "8px",
                                background: "#eee",
                                border: "none",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphExplorer;
