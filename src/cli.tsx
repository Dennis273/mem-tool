#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { DEFAULT_CONFIG } from './config.js';
import { parseArgv } from './utils/argv.js';

const config = { ...DEFAULT_CONFIG, ...parseArgv(process.argv) };

render(<App config={config} />);
