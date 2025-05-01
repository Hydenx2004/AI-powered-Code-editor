import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { LANGUAGE_VERSIONS } from "../constants";

const languages = Object.entries(LANGUAGE_VERSIONS);

const LanguageSelector = ({ language, onSelect }) => {
  return (
    <Box mb={4}>
      <Menu isLazy>
        <MenuButton 
          as={Button} 
          variant="outline" 
          colorScheme="brand" 
          borderWidth="1px"
          borderColor="editor.border"
          bg="rgba(255, 255, 255, 0.05)"
          _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
          _active={{ bg: "rgba(255, 255, 255, 0.15)" }}
          borderRadius="md"
          px={4}
          rightIcon={<ChevronDownIcon />}
        >
          <HStack>
            <Text>{language}</Text>
            <Text fontSize="xs" color="editor.muted">
              ({LANGUAGE_VERSIONS[language]})
            </Text>
          </HStack>
        </MenuButton>
        <MenuList 
          bg="editor.sidebar" 
          borderColor="editor.border"
          boxShadow="lg"
          borderRadius="md"
          py={2}
        >
          {languages.map(([lang, version]) => (
            <MenuItem
              key={lang}
              color={lang === language ? "brand.400" : "editor.text"}
              bg={lang === language ? "rgba(10, 171, 255, 0.1)" : "transparent"}
              _hover={{
                color: "brand.400",
                bg: "rgba(255, 255, 255, 0.1)",
              }}
              _focus={{
                color: "brand.400",
                bg: "rgba(255, 255, 255, 0.1)",
              }}
              onClick={() => onSelect(lang)}
              px={4}
              py={2}
            >
              <HStack spacing={2}>
                <Text fontWeight={lang === language ? "bold" : "normal"}>
                  {lang}
                </Text>
                <Text color="editor.muted" fontSize="xs">
                  ({version})
                </Text>
              </HStack>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
