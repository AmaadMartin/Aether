// src/Components/VersionTree.js

import React, { useState, useEffect, useContext } from "react";
import Tree from "react-d3-tree";
import "./VersionTree.css";
import api from "../Services/api";
import { AuthContext } from "../Contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";

const VersionTree = ({ functionId, onVersionSelect, currentVersion }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [versionTreeData, setVersionTreeData] = useState(null);
  const [functionKey, setFunctionKey] = useState(null);
  const { userEmail } = useContext(AuthContext);

  useEffect(() => {
    fetchVersionTree();
  }, [functionId]);

  const fetchVersionTree = async () => {
    try {
      const func_response = await api.get(
        `/users/${encodeURIComponent(userEmail)}/function/${functionId}`
      );
      const func = func_response.data.function;
      if (!func) return;
      setFunctionKey(func.function_key);
      const versionMap = func.version_map;
      const tree = convertVersionTree(func.version_tree, versionMap);
      setVersionTreeData(tree);
    } catch (error) {
      console.error("Error fetching version tree:", error);
    }
  };

  const handleNodeClick = async (rd3tProps) => {
    const nodeData = rd3tProps.nodeDatum;
    const versionName = nodeData.versionName;
    setSelectedNode(versionName);
    if (onVersionSelect) {
      onVersionSelect(versionName);
    }
  };

  // Function to compute average score for a version
  const computeAverageScore = (versionData) => {
    const calls = versionData.calls || [];
    let totalScore = 0;
    let scoreCount = 0;

    calls.forEach((call) => {
      if (call.evaluation && call.evaluation.scores) {
        const scores = call.evaluation.scores;
        Object.values(scores).forEach((value) => {
          if (typeof value === "number") {
            totalScore += value;
            scoreCount += 1;
          }
        });
      }
    });

    if (scoreCount === 0) return null;
    return totalScore / scoreCount;
  };

  // Convert version tree to the format expected by react-d3-tree
  const convertVersionTree = (node, versionMap) => {
    const versionData = versionMap[node.name] || {};
    const averageScore = computeAverageScore(versionData);
    const newNode = {
      name: node.name,
      versionName: node.name,
      label: `${node.name.slice(0, 6)}...`,
      attributes: {
        averageScore: averageScore,
        date: versionData.date || "",
      },
      children: node.children
        ? node.children.map((child) => convertVersionTree(child, versionMap))
        : [],
    };
    return newNode;
  };

  const renderCustomNodeElement = (rd3tProps) => {
    const nodeDatum = rd3tProps.nodeDatum;
    const isSelected = nodeDatum.versionName === selectedNode;
    const isDeployed = nodeDatum.versionName === currentVersion;

    // Determine node color based on average score
    let nodeColor = "#999"; // Default color if no score
    const averageScore =
      nodeDatum.attributes && nodeDatum.attributes.averageScore;
    if (averageScore !== null && averageScore !== undefined) {
      // Map average score from 0-100 to hue from red to green
      const hue = (averageScore * 120) / 100; // 0 (red) to 120 (green)
      nodeColor = `hsl(${hue}, 70%, 50%)`;
    }

    return (
      <g
        onClick={() => handleNodeClick(rd3tProps)}
        style={{ cursor: "pointer" }}
        className="node-group"
      >
        <circle
          r={15}
          fill={nodeColor}
          stroke={isSelected ? "#000" : "#fff"}
          strokeWidth={isSelected ? 3 : 1}
        />
        <text x={20} dy={5} fontSize={14} fill="#333">
          {nodeDatum.label || "Version"}
        </text>
        {nodeDatum.attributes && (
          <>
            {isDeployed && (
              <text x={20} dy={40} fontSize={12} fill="#666">
                Deployed
              </text>
            )}
          </>
        )}
      </g>
    );
  };

  return (
    <div className="tree-container">
      {versionTreeData ? (
        <Tree
          data={versionTreeData}
          orientation="vertical"
          pathFunc="diagonal" // Changed from 'elbow' to 'diagonal'
          translate={{ x: 150, y: 50 }}
          nodeSize={{ x: 200, y: 100 }}
          separation={{ siblings: 0.6, nonSiblings: 0.6 }}
          renderCustomNodeElement={renderCustomNodeElement}
          transitionDuration={500} // Enable transitions
        />
      ) : (
        <Box
          className="logs-message"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <CircularProgress />
        </Box>
      )}
    </div>
  );
};

export default VersionTree;
