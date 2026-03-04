import React from 'react';
import { Box, Text, useStdout } from 'ink';

interface TitledBoxProps {
  title: string;
  titleRight?: string;
  children: React.ReactNode;
}

export function TitledBox({ title, titleRight, children }: TitledBoxProps) {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 60;
  const innerWidth = cols - 2; // subtract ╭ and ╮

  const leftPart = `─ ${title} `;
  const rightPart = titleRight ? ` ${titleRight} ─` : ' ─';
  const dashCount = innerWidth - leftPart.length - rightPart.length;
  const dashes = dashCount > 0 ? '─'.repeat(dashCount) : '';
  const topLine = `╭${leftPart}${dashes}${rightPart}╮`;

  return (
    <Box flexDirection="column">
      <Text>{topLine}</Text>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderTop={false}
        paddingLeft={1}
        paddingRight={1}
      >
        {children}
      </Box>
    </Box>
  );
}
