import { useState, useRef } from "react";
import { 
  Box, 
  Button, 
  Text, 
  useToast, 
  Flex, 
  Heading,
  Icon,
  Spinner,
  Badge,
  Input,
  InputGroup,
  InputRightElement,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Collapse
} from "@chakra-ui/react";
import { executeCode } from "../api";

// Custom play icon
const PlayIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M8 5v14l11-7z"
    />
  </Icon>
);

// Custom send icon
const SendIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
    />
  </Icon>
);

const Output = ({ editorRef, language }) => {
  const toast = useToast();
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [executionId, setExecutionId] = useState(null);
  const [errorAnalysis, setErrorAnalysis] = useState(null);
  const outputEndRef = useRef(null);

  // Scroll to bottom when output changes
  const scrollToBottom = () => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Function to split code into logical chunks
  const splitCodeIntoChunks = (code) => {
    const lines = code.split('\n');
    const chunks = [];
    let currentChunk = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentChunk.push(line);
      
      // Split on empty lines, function declarations, or class declarations
      if (line.trim() === '' || 
          line.includes('function') || 
          line.includes('class') || 
          i === lines.length - 1) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join('\n'));
          currentChunk = [];
        }
      }
    }
    
    return chunks;
  };

  // Function to analyze code and identify problematic chunks
  const analyzeCode = async (code) => {
    const chunks = splitCodeIntoChunks(code);
    let problematicChunk = null;
    let errorMessage = null;

    // First try to execute the entire code
    try {
      const fullResult = await executeCode(language, code);
      if (fullResult.run.stderr) {
        // If there's an error in the full code, try to identify the problematic chunk
        for (let i = 0; i < chunks.length; i++) {
          try {
            // For each chunk, create a test code that includes all previous chunks
            const testCode = chunks.slice(0, i + 1).join('\n');
            const result = await executeCode(language, testCode);
            
            if (result.run.stderr) {
              problematicChunk = chunks[i];
              errorMessage = result.run.stderr;
              break;
            }
          } catch (error) {
            problematicChunk = chunks[i];
            errorMessage = error.message;
            break;
          }
        }
      }
    } catch (error) {
      // If the full code execution fails, try to identify the problematic chunk
      for (let i = 0; i < chunks.length; i++) {
        try {
          const testCode = chunks.slice(0, i + 1).join('\n');
          const result = await executeCode(language, testCode);
          
          if (result.run.stderr) {
            problematicChunk = chunks[i];
            errorMessage = result.run.stderr;
            break;
          }
        } catch (error) {
          problematicChunk = chunks[i];
          errorMessage = error.message;
          break;
        }
      }
    }

    if (problematicChunk) {
      setErrorAnalysis({
        chunk: problematicChunk,
        error: errorMessage,
        fullCode: code
      });
      return true;
    }
    return false;
  };

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;

    try {
      setIsLoading(true);
      setWaitingForInput(false);
      setExecutionId(null);
      setUserInput("");
      setErrorAnalysis(null);
      
      // First analyze the code for potential errors
      const hasError = await analyzeCode(sourceCode);
      
      if (hasError) {
        // Keep loading state active while the fix is being applied
        // Don't show the error analysis UI
        
        // Automatically request AI fix for the error
        if (window.handleCodeFixRequest) {
          window.handleCodeFixRequest(
            errorAnalysis.chunk,
            errorAnalysis.error,
            errorAnalysis.fullCode
          );
          
          // Set a custom loading message
          setOutput(["Analyzing and fixing code..."]);
          return;
        }
      }

      const startTime = performance.now();
      const result = await executeCode(language, sourceCode);
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      
      if (result.run.output.includes("Waiting for input:")) {
        setWaitingForInput(true);
        if (result.run.executionId) {
          setExecutionId(result.run.executionId);
        }
      }
      
      setOutput(result.run.output.split("\n"));
      result.run.stderr ? setIsError(true) : setIsError(false);
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.log(error);
      toast({
        title: "An error occurred.",
        description: error.message || "Unable to run code",
        status: "error",
        duration: 6000,
        isClosable: true,
        position: "top",
        variant: "solid",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitInput = async () => {
    if (!userInput.trim()) return;
    
    // Add the user input to the output
    setOutput(prev => [...prev, `> ${userInput}`]);
    
    try {
      setIsLoading(true);
      
      // Get the current code
      const sourceCode = editorRef.current.getValue();
      
      // Call the API with the input
      const result = await executeCode(language, sourceCode, userInput, executionId);
      
      // Update the output with the result
      setOutput(prev => [...prev, ...result.run.output.split("\n")]);
      
      // Check if we need more input
      if (result.run.output.includes("Waiting for input:")) {
        setWaitingForInput(true);
        if (result.run.executionId) {
          setExecutionId(result.run.executionId);
        }
      } else {
        setWaitingForInput(false);
        setExecutionId(null);
      }
      
      // Clear the input field
      setUserInput("");
      
      // Scroll to the bottom to show the new output
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.log(error);
      toast({
        title: "An error occurred.",
        description: error.message || "Unable to process input",
        status: "error",
        duration: 6000,
        isClosable: true,
        position: "top",
        variant: "solid",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitInput();
    }
  };

  return (
    <Box h="100%" display="flex" flexDirection="column">
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <Heading size="sm" color="editor.text">
          Output
        </Heading>
        
        <Flex alignItems="center" gap={2}>
          {executionTime && !isLoading && (
            <Badge 
              colorScheme={isError ? "red" : "green"} 
              variant="subtle"
              px={2}
              py={1}
              borderRadius="md"
              fontSize="xs"
            >
              {executionTime}ms
            </Badge>
          )}
          
          <Button
            variant="solid"
            colorScheme="brand"
            size="sm"
            isLoading={isLoading && !waitingForInput}
            onClick={runCode}
            leftIcon={<PlayIcon />}
            loadingText="Running"
            _loading={{ 
              opacity: 0.8,
              cursor: "progress" 
            }}
            borderRadius="md"
          >
            Run Code
          </Button>
        </Flex>
      </Flex>
      
      <Box
        flex="1"
        p={4}
        bg="editor.bg"
        color={isError ? "red.400" : "editor.text"}
        borderRadius="md"
        overflowY="auto"
        borderWidth="1px"
        borderColor="editor.border"
        position="relative"
        display="flex"
        flexDirection="column"
      >
        <Box flex="1">
          {isLoading ? (
            <Flex 
              justifyContent="center" 
              alignItems="center" 
              h="100%"
              flexDirection="column"
              gap={3}
            >
              <Spinner color="brand.400" size="md" />
              <Text fontSize="sm" color="editor.muted">
                {output && output[0] === "Analyzing and fixing code..." 
                  ? "Analyzing and fixing code..."
                  : "Executing code..."}
              </Text>
            </Flex>
          ) : output ? (
            <Box fontFamily="mono" fontSize="sm" whiteSpace="pre-wrap" lineHeight="tall">
              {output.map((line, i) => (
                <Text key={i}>
                  {line}
                </Text>
              ))}
              <div ref={outputEndRef} />
            </Box>
          ) : (
            <Flex 
              justifyContent="center" 
              alignItems="center" 
              h="100%"
              flexDirection="column"
              color="editor.muted"
            >
              <Icon as={PlayIcon} boxSize={8} mb={2} />
              <Text>Click "Run Code" to see the output here</Text>
            </Flex>
          )}
        </Box>
        
        {waitingForInput && (
          <Box mt={4} borderTopWidth="1px" borderTopColor="editor.border" pt={3}>
            <InputGroup size="md">
              <Input
                placeholder="Enter your input here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                bg="rgba(0, 0, 0, 0.2)"
                borderColor="editor.border"
                _hover={{ borderColor: "brand.400" }}
                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
                color="editor.text"
                autoFocus
              />
              <InputRightElement width="4.5rem">
                <Button 
                  h="1.75rem" 
                  size="sm" 
                  onClick={submitInput}
                  colorScheme="brand"
                  leftIcon={<SendIcon />}
                  mr={1}
                >
                  Send
                </Button>
              </InputRightElement>
            </InputGroup>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Output;
