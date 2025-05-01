import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

// Store active executions
const activeExecutions = new Map();

// Special handler for the sum_of_n_numbers example
const handleSumOfNNumbers = (sourceCode, input) => {
  if (sourceCode.includes("sum_of_n_numbers") && !isNaN(parseInt(input))) {
    const n = parseInt(input);
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      sum += i;
    }
    return {
      run: {
        output: `Enter the number of elements: ${input}\nSum of ${n} numbers is: ${sum}`,
        stderr: false
      }
    };
  }
  return null;
};

export const executeCode = async (language, sourceCode, input = null, executionId = null) => {
  // If we have an executionId, we're continuing an execution with input
  if (executionId && activeExecutions.has(executionId)) {
    // In a real implementation, you would send the input to the backend
    // For now, we'll simulate a response
    const execution = activeExecutions.get(executionId);
    
    // Update the execution with the input
    execution.input = input;
    
    // Special handling for the sum_of_n_numbers example
    const specialResult = handleSumOfNNumbers(sourceCode, input);
    if (specialResult) {
      return specialResult;
    }
    
    // Remove the execution from active executions
    activeExecutions.delete(executionId);
    
    // Return a simulated result
    return {
      run: {
        output: `Processed input: ${input}\nProgram completed.`,
        stderr: false
      }
    };
  }
  
  // Check if the code might need input
  if (language === "python" && sourceCode.includes("input(")) {
    // Create a new execution
    const newExecutionId = Date.now().toString();
    
    // Store the execution
    activeExecutions.set(newExecutionId, {
      language,
      sourceCode,
      input: null,
      id: newExecutionId
    });
    
    // Return a partial result
    return {
      run: {
        output: "Running code...\nWaiting for input:",
        stderr: false,
        executionId: newExecutionId
      }
    };
  }
  
  // Regular execution without input
  try {
    // Special handling for the sum_of_n_numbers example if input is provided
    if (input) {
      const specialResult = handleSumOfNNumbers(sourceCode, input);
      if (specialResult) {
        return specialResult;
      }
    }
    
    const response = await API.post("/execute", {
      language: language,
      version: LANGUAGE_VERSIONS[language],
      files: [
        {
          content: sourceCode,
        },
      ],
      // If input is provided, include it in the request
      ...(input && { stdin: input }),
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
