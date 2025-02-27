export function extractNodeNames(jsonString: string): string[] | string {
    try {
      const jsonObject = JSON.parse(jsonString);
      if (!jsonObject.parameters || !Array.isArray(jsonObject.parameters)) {
        throw new Error("Invalid JSON structure: 'parameters' field is missing or not an array.");
      }
  
      const nodeNames = new Set<string>();
      jsonObject.parameters.forEach((param: any) => {
        if (param.name && typeof param.name === "string") {
          const match = param.name.match(/^\/(.*?)\./);
          if (match) {
            nodeNames.add(match[1]);
          }
        }
      });
  
      return Array.from(nodeNames);
    } catch (error) {
      if (error instanceof Error) {
        return `Error: ${error.message}`;
      }
      return "Error: An unknown error occurred.";
    }
  }

  export function extractParametersByNode(jsonString: string, nodeName: string): [string[], number[], number[], number[], number[]] {
    const jsonObject = JSON.parse(jsonString);
    if (!jsonObject.parameters || !Array.isArray(jsonObject.parameters)) {
      throw new Error("Invalid JSON structure: 'parameters' field is missing or not an array.");
    }
  
    const parameters = jsonObject.parameters
      .filter((param: any) =>
        param.name.startsWith(`/${nodeName}.`) &&
        !param.name.endsWith("min") &&
        !param.name.endsWith("max") &&
        !param.name.endsWith("step") &&
        !param.name.includes("location") &&
        !param.name.includes("sim") &&
        !param.name.endsWith("__")
      );

      const min = jsonObject.parameters
      .filter((param: any) => 
        param.name.startsWith(`/${nodeName}.`) &&
        param.name.endsWith("min")
      );

      const max = jsonObject.parameters
      .filter((param: any) => 
        param.name.startsWith(`/${nodeName}.`) &&
        param.name.endsWith("max")
      );

      const step = jsonObject.parameters
      .filter((param: any) => 
        param.name.startsWith(`/${nodeName}.`) &&
        param.name.endsWith("step")
      );
  
    const paramNames = parameters.map((param: any) => param.name.split(".")[1]);
    const paramValues = parameters.map((param: any) => param.value);
    const minValues = min.map((param: any) => param.value);
    const maxValues = max.map((param: any) => param.value);
    const stepValues = step.map((param: any) => param.value);
  
    return [paramNames, paramValues, minValues, maxValues, stepValues];
  }
  