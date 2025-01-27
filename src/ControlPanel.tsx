import { PanelExtensionContext, SettingsTreeAction } from "@foxglove/extension";
import { ReactElement, useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { extractNodeNames, extractParametersByNode } from "./helper";

let globalEventData: string = "";

function ControlPanel({ context }: { context: PanelExtensionContext }): ReactElement {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [nodeOptions, setNodeOptions] = useState<string[] | string>([]); 
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [nodeParams, setNodeParams] = useState<string[] | string>([]);
  const [sliderValues, setSliderValues] = useState<number[]>([]);
  const [minValues, setMinValues] = useState<number[]>([]);
  const [maxValues, setMaxValues] = useState<number[]>([]);
  const [stepValues, setStepValues] = useState<number[]>([]);

  useEffect(() => {
    const websocket = new WebSocket("ws://192.168.1.100:8765", ["foxglove.websocket.v1"]);

    websocket.onopen = () => {
      console.log("WebSocket connection established");
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    websocket.onmessage = (event) => {
      console.log("Received WebSocket message:", event.data);
      globalEventData = event.data;

      const extractedNodes = extractNodeNames(event.data);
      setNodeOptions(extractedNodes);
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  const sendMessage = useCallback(
    (message: object) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        console.error("WebSocket is not open");
      }
    },
    [ws],
  );

  const fetchParameters = useCallback(() => {
    const message = {
      op: "getParameters",
      parameterNames: [],
      id: "fetch-parameters",
    };
    sendMessage(message);
  }, [sendMessage]);

  const handleSliderChange = (index: number, value: number) => {
    const newValues = [...sliderValues];
    newValues[index] = value;
    setSliderValues(newValues);

    const setMessage = {
      op: "setParameters",
      parameters: [
        {
          name: `${selectedNode}.${nodeParams[index]}`,
          value,
          type: "float64",
        },
      ],
      id: `slider-${index}-${value}-${nodeParams[index]}`,
    };
    sendMessage(setMessage);
  };

  const handleValueChange = (index: number, value: number) => {
    const newValues = [...sliderValues];
    newValues[index] = value;
    setSliderValues(newValues);

    const setMessage = {
      op: "setParameters",
      parameters: [
        {
          name: `${selectedNode}.${nodeParams[index]}`,
          value,
          type: "float64",
        },
      ],
      id: `slider-${index}-${value}-${nodeParams[index]}`,
    };
    sendMessage(setMessage);
  };

  const actionHandler = useCallback((action: SettingsTreeAction) => {
    if (
      action.action === "update" &&
      action.payload.path[0] === "general" &&
      action.payload.path[1] === "selectedNode"
    ) {
      setSelectedNode(action.payload.value as string);

      const [params, values, min, max, steps] = extractParametersByNode(
        globalEventData,
        action.payload.value as string,
      );
      setNodeParams(params);
      setSliderValues(values);
      setMinValues(min);
      setMaxValues(max);
      setStepValues(steps);
    }
  }, []);

  useEffect(() => {
    context.updatePanelSettingsEditor({
      actionHandler,
      nodes: {
        general: {
          label: "General Settings",
          fields: {
            selectedNode: {
              label: "Select Node",
              input: "select",
              options: Array.isArray(nodeOptions)
                ? nodeOptions.map((node) => ({ value: node, label: node }))
                : [],
              value: selectedNode,
            },
          },
        },
      },
    });
  }, [context, nodeOptions, selectedNode, actionHandler]);

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", overflowY: "auto", height: "100%"}}>
      <h2>Parameter slider</h2>
      <p>Click on 'Get Parameters', on the panel settings, select the node.</p>

      <button onClick={fetchParameters} style={{ marginTop: "1rem" }}>
        Get Parameters
      </button>

      <div style={{ marginTop: "1rem" }}>
        {sliderValues.map((value, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1", textAlign: "right", marginRight: "1rem" }}>
              {nodeParams[index]}:
              <input
                type="number"
                value={value}
                onChange={(e) => handleValueChange(index, parseFloat(e.target.value))}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.3rem",
                  width: "80px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  textAlign: "right",
                }}
              />
            </div>
            <div style={{ flex: "3" }}>
              <input
                type="range"
                min={minValues[index]}
                max={maxValues[index]}
                step={stepValues[index]}
                value={value}
                onChange={(e) => handleSliderChange(index, parseFloat(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function initControlPanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<ControlPanel context={context} />);

  return () => {
    root.unmount();
  };
}

export { globalEventData };
