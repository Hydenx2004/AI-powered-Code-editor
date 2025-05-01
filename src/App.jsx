import { Box } from "@chakra-ui/react";
import CodeEditor from "./components/CodeEditor";

function App() {
  return (
    <Box 
      minH="100vh" 
      bg="editor.bg" 
      color="editor.text" 
      position="relative"
      overflow="hidden"
    >
      {/* Background gradient elements */}
      <Box
        position="absolute"
        top="-100px"
        right="-100px"
        width="500px"
        height="500px"
        borderRadius="full"
        bg="rgba(10, 171, 255, 0.1)"
        filter="blur(80px)"
        zIndex="0"
      />
      <Box
        position="absolute"
        bottom="-100px"
        left="-100px"
        width="400px"
        height="400px"
        borderRadius="full"
        bg="rgba(92, 200, 255, 0.08)"
        filter="blur(60px)"
        zIndex="0"
      />
      
      {/* Main content */}
      <Box 
        position="relative" 
        zIndex="1" 
        px={{ base: 2, md: 6 }} 
        py={{ base: 4, md: 8 }}
        className="animate-fadeIn"
      >
        <CodeEditor />
      </Box>
    </Box>
  );
}

export default App;
