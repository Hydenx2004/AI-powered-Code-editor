import { useState, useRef, useEffect } from "react";
import { 
  Box, 
  Input, 
  Button, 
  VStack, 
  Text, 
  HStack, 
  IconButton, 
  Switch, 
  FormControl, 
  FormLabel,
  Flex,
  Heading,
  Tooltip,
  useColorModeValue,
  Icon,
  InputGroup,
  InputRightElement,
  Divider
} from "@chakra-ui/react";
import { CopyIcon, CheckIcon } from "@chakra-ui/icons";

// Custom icons
const SendIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
    />
  </Icon>
);

const MagicIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a1 1 0 00-1.41 0L1.29 18.96a1 1 0 000 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a1 1 0 000-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z"
    />
  </Icon>
);

const ChatIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
    />
  </Icon>
);

const ChatComposer = ({ apiKey, editorRef, onRunCode }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isComposerMode, setIsComposerMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copyStatus, setCopyStatus] = useState({});
  const messagesEndRef = useRef(null);

  // Add a function to handle code fix requests
  const handleCodeFixRequest = (errorChunk, errorMessage, fullCode) => {
    const fixRequest = `Please fix this code chunk that has an error:\n\n${errorChunk}\n\nError: ${errorMessage}\n\nFull code context:\n${fullCode}`;
    
    // Don't display anything in the chat component
    // Just send the request silently to get and apply the fix
    setIsSending(true);
    
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { 
            role: "system", 
            content: "You are a coding expert who provides only code with no explanation. Return only executable code."
          },
          { role: "user", content: fixRequest },
        ],
        temperature: 0.3,
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const reply = data?.choices?.[0]?.message?.content;
      if (reply) {
        const cleanedReply = cleanResponse(reply);
        // Directly apply the fix to the editor without showing in chat
        applyGeneratedCode(cleanedReply);
      }
    })
    .catch(error => {
      console.error("Error sending silent fix request:", error);
    })
    .finally(() => {
      setIsSending(false);
    });
  };
  
  // Expose the handleCodeFixRequest function to parent
  useEffect(() => {
    window.handleCodeFixRequest = handleCodeFixRequest;
  }, []);
  
  // Create a version of sendMessage that accepts text input directly
  const sendMessageWithText = async (text) => {
    if (!text.trim() || isSending) return;

    setMessages([...messages, { sender: "user", text }]);
    setIsSending(true);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { 
              role: "system", 
              content: isComposerMode 
                ? "You are a coding expert who provides only code with no explanation. Return only executable code."
                : "You are a coding expert who provides concise and accurate code with no documentation or comments or explanations." 
            },
            { role: "user", content: text },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw API Response:", data);

      const reply = data?.choices?.[0]?.message?.content;
      if (reply) {
        console.log("Raw Reply:", reply);
        const cleanedReply = cleanResponse(reply);
        console.log("Cleaned Reply:", cleanedReply);
        
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: cleanedReply },
        ]);

        // In composer mode, automatically apply the code and run it
        if (isComposerMode) {
          applyGeneratedCode(cleanedReply);
        }
      } else {
        console.error("Unexpected response format:", data);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: "Sorry, I couldn't process your request." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;
    sendMessageWithText(input);
    setInput("");
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const cleanResponse = (text) => {
    // Remove leading and trailing triple quotes
    return text.replace(/^```|```$/g, '').trim();
  };

  const handleModeChange = () => {
    setIsComposerMode(!isComposerMode);
    setMessages([]); // Clear messages when switching modes
  };

  const applyGeneratedCode = (code) => {
    if (editorRef.current) {
      editorRef.current.setValue(code);
      // Wrap the run-code trigger separately so errors here don't bubble up
      try {
        onRunCode();
      } catch (error) {
        console.error("Error triggering run button:", error);
      }
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log("Copied to clipboard");
        setCopyStatus({ [index]: true });
        
        // Reset copy status after 2 seconds
        setTimeout(() => {
          setCopyStatus({});
        }, 2000);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <VStack spacing={3} align="stretch" h="100%">
      <Flex justifyContent="space-between" alignItems="center" mb={1}>
        <Heading size="sm" color="editor.text">
          {isComposerMode ? "AI Composer" : "AI Chat"}
        </Heading>
        
        <FormControl display="flex" alignItems="center" justifyContent="flex-end" width="auto">
          <Tooltip 
            label={isComposerMode ? "AI generates and applies code directly" : "Chat with AI about code"} 
            placement="top"
          >
            <FormLabel htmlFor="mode-toggle" mb="0" color="editor.muted" fontSize="xs" mr={2} cursor="help">
              {isComposerMode ? "Composer" : "Chat"}
            </FormLabel>
          </Tooltip>
          <Switch
            id="mode-toggle"
            colorScheme="brand"
            isChecked={isComposerMode}
            onChange={handleModeChange}
            size="sm"
          />
        </FormControl>
      </Flex>
      
      <Divider borderColor="editor.border" opacity={0.5} />
      
      <Box 
        flex="1" 
        overflowY="auto" 
        bg="editor.bg" 
        p={3} 
        borderRadius="md"
        borderWidth="1px"
        borderColor="editor.border"
        className="custom-scrollbar"
      >
        {messages.length === 0 ? (
          <Flex 
            justifyContent="center" 
            alignItems="center" 
            h="100%" 
            flexDirection="column"
            color="editor.muted"
            textAlign="center"
            px={4}
          >
            <Icon 
              as={isComposerMode ? MagicIcon : ChatIcon} 
              boxSize={8} 
              mb={3}
              color="brand.400"
            />
            <Text fontSize="sm" mb={2}>
              {isComposerMode 
                ? "Describe the code you want to generate" 
                : "Ask questions about your code"}
            </Text>
            <Text fontSize="xs" maxW="80%">
              {isComposerMode 
                ? "The AI will generate and apply code directly to the editor" 
                : "Chat with the AI to get code snippets and programming help"}
            </Text>
          </Flex>
        ) : (
          messages.map((msg, index) => (
            <Box 
              key={index} 
              mb={4} 
              p={3} 
              bg={msg.sender === "user" ? "rgba(255, 255, 255, 0.05)" : "rgba(10, 171, 255, 0.05)"} 
              borderRadius="md"
              borderLeftWidth="2px"
              borderLeftColor={msg.sender === "user" ? "editor.muted" : "brand.400"}
              className={index === messages.length - 1 ? "animate-fadeIn" : ""}
            >
              <Text fontSize="xs" color={msg.sender === "user" ? "editor.muted" : "brand.400"} mb={1} fontWeight="bold">
                {msg.sender === "user" ? "You" : "AI"}
              </Text>
              <Text 
                fontFamily="mono" 
                whiteSpace="pre-wrap" 
                fontSize="sm"
                lineHeight="tall"
              >
                {msg.text}
              </Text>
              {msg.sender === "bot" && !isComposerMode && (
                <Tooltip label={copyStatus[index] ? "Copied!" : "Copy to clipboard"}>
                  <IconButton
                    aria-label="Copy to clipboard"
                    icon={copyStatus[index] ? <CheckIcon /> : <CopyIcon />}
                    size="xs"
                    mt={2}
                    onClick={() => copyToClipboard(msg.text, index)}
                    variant="ghost"
                    colorScheme={copyStatus[index] ? "green" : "gray"}
                  />
                </Tooltip>
              )}
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      <InputGroup size="md">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isComposerMode ? "Describe the code you want..." : "Type a message..."}
          bg="editor.bg"
          color="editor.text"
          borderColor="editor.border"
          _hover={{ borderColor: "brand.400" }}
          _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
          pr="4.5rem"
        />
        <InputRightElement width="4.5rem">
          <Button 
            h="1.75rem" 
            size="sm" 
            onClick={sendMessage} 
            colorScheme="brand"
            isLoading={isSending}
            leftIcon={<SendIcon />}
            mr={1}
          >
            Send
          </Button>
        </InputRightElement>
      </InputGroup>
    </VStack>
  );
};

export default ChatComposer;
