import { useRef, useState } from "react";
import { 
  Box, 
  Grid, 
  GridItem, 
  Heading, 
  Flex, 
  Text,
  useBreakpointValue
} from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import ChatComposer from "./ChatComposer";

const CodeEditor = () => {
  const editorRef = useRef();
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("javascript");
  
  // Responsive layout adjustment
  const layout = useBreakpointValue({
    base: "mobile", // Stack everything vertically
    lg: "desktop"   // Use grid layout
  });

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const onSelect = (language) => {
    setLanguage(language);
    setValue(CODE_SNIPPETS[language]);
  };

  const handleRunCode = () => {
    // Query all buttons and find the one whose text is exactly "Run Code"
    const buttons = document.querySelectorAll("button");
    const runButton = Array.from(buttons).find(
      (btn) => btn.textContent.trim() === "Run Code"
    );
    if (runButton) {
      runButton.click();
    } else {
      console.error("Run Code button not found.");
    }
  };

  return (
    <Box h="100vh" p={{ base: 2, md: 4 }} className="animate-slideUp">
      {/* Header with logo and title */}
      <Flex 
        mb={6} 
        alignItems="center" 
        justifyContent="center" 
        direction="column"
      >
        <Heading 
          size="xl" 
          fontWeight="bold" 
          letterSpacing="tight"
          className="text-gradient"
          mb={2}
        >
          CodeFusion
        </Heading>
        <Text color="editor.muted" fontSize="md">
          Modern Code Editor with AI Assistance
        </Text>
      </Flex>

      {layout === "mobile" ? (
        // Mobile layout - stacked
        <Flex direction="column" h="calc(100vh - 120px)" gap={4}>
          <Box h="40%" className="glass-panel" p={3}>
            <LanguageSelector language={language} onSelect={onSelect} />
            <Box h="calc(100% - 60px)">
              <Editor
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'Fira Code', monospace",
                  scrollBeyondLastLine: false,
                }}
                height="100%"
                theme="vs-dark"
                language={language}
                defaultValue={CODE_SNIPPETS[language]}
                onMount={onMount}
                value={value}
                onChange={(value) => setValue(value)}
              />
            </Box>
          </Box>
          
          <Box h="30%" className="glass-panel" p={3}>
            <Output editorRef={editorRef} language={language} />
          </Box>
          
          <Box h="30%" className="glass-panel" p={3}>
            <ChatComposer 
              apiKey="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" 
              editorRef={editorRef}
              onRunCode={handleRunCode}
            />
          </Box>
        </Flex>
      ) : (
        // Desktop layout - grid
        <Grid
          h="calc(100vh - 120px)"
          templateAreas={`
            "editor editor chat"
            "output output chat"
          `}
          gridTemplateRows={"60% 40%"}
          gridTemplateColumns={"35% 35% 30%"}
          gap={4}
        >
          <GridItem area="editor" colSpan={2} className="glass-panel" p={4}>
            <Box h="100%">
              <LanguageSelector language={language} onSelect={onSelect} />
              <Box h="calc(100% - 60px)">
                <Editor
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'Fira Code', monospace",
                    scrollBeyondLastLine: false,
                  }}
                  height="100%"
                  theme="vs-dark"
                  language={language}
                  defaultValue={CODE_SNIPPETS[language]}
                  onMount={onMount}
                  value={value}
                  onChange={(value) => setValue(value)}
                />
              </Box>
            </Box>
          </GridItem>

          <GridItem area="chat" rowSpan={2} className="glass-panel" p={4}>
            <Box h="100%">
              <ChatComposer 
                apiKey="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" 
                editorRef={editorRef}
                onRunCode={handleRunCode}
              />
            </Box>
          </GridItem>

          <GridItem area="output" colSpan={2} className="glass-panel" p={4}>
            <Output editorRef={editorRef} language={language} />
          </GridItem>
        </Grid>
      )}
    </Box>
  );
};

export default CodeEditor;
