// src/Components/VersionTree.js

import React, { useState, useEffect, useContext } from "react";
import Tree from "react-d3-tree";
import "./VersionTree.css";
import api from "../Services/api";
import { AuthContext } from "../Contexts/AuthContext";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { set } from "react-hook-form";
import { CircularProgress } from "@mui/material";

const VersionTree = ({
  functionId,
  onVersionSelect,
  currentVersion,
}) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [versionTreeData, setVersionTreeData] = useState(null);
  const [functionKey, setFunctionKey] = useState(null);
  const { userEmail, tier } = useContext(AuthContext);

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
      const tree = convertVersionTree(func.version_tree);
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

  const renderCustomNodeElement = (rd3tProps) => {
    const nodeDatum = rd3tProps.nodeDatum;
    const isSelected = nodeDatum.versionName === selectedNode;
    const isDeployed = nodeDatum.versionName === currentVersion;

    return (
      <g
        onClick={() => handleNodeClick(rd3tProps)}
        style={{ cursor: "pointer" }}
        className="node-group"
      >
        <circle
          r={15}
          className={
            isSelected
              ? isDeployed
                ? "node-circle-selected-deployed"
                : "node-circle-selected"
              : isDeployed
              ? "node-circle-deployed"
              : "node-circle"
          }
        />
        <text x={20} dy={5} fontSize={14} fill="#333">
          {nodeDatum.label || "Version"}
        </text>
        {nodeDatum.attributes && (
          <text x={20} dy={25} fontSize={12} fill="#666">
            {new Date(nodeDatum.attributes.date).toLocaleString()}
          </text>
        )}
      </g>
    );
  };

  // Convert version tree to the format expected by react-d3-tree
  const convertVersionTree = (node, index = 1) => {
    const newNode = {
      name: node.name,
      versionName: node.name,
      // cut node name short for label
      label: `${node.name.slice(0, 6)}...`,
      children: node.children
        ? node.children.map((child, idx) =>
            convertVersionTree(child, index + idx + 1)
          )
        : [],
    };
    return newNode;
  };

  return (
    <div className="tree-container">
      {versionTreeData ? (
        <Tree
          data={versionTreeData}
          orientation="vertical"
          pathFunc="elbow"
          translate={{ x: 150, y: 50 }}
          nodeSize={{ x: 200, y: 100 }}
          separation={{ siblings: 1, nonSiblings: 1 }}
          renderCustomNodeElement={renderCustomNodeElement}
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
