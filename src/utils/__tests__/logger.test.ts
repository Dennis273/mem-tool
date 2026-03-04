import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ensureCsvHeader, appendCsv } from '../logger.js';
import type { ProcessInfo } from '../process.js';

const CSV_HEADER = 'timestamp,pid,phys_footprint_mb,rss_mb,vsz_mb,command';

describe('logger', () => {
  let tmpDir: string;
  let logFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mem-tool-test-'));
    logFile = path.join(tmpDir, 'test.csv');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  describe('ensureCsvHeader', () => {
    test('creates file with header when file does not exist', () => {
      ensureCsvHeader(logFile);

      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toBe(CSV_HEADER + '\n');
    });

    test('does not overwrite existing file', () => {
      fs.writeFileSync(logFile, 'existing data\n');

      ensureCsvHeader(logFile);

      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toBe('existing data\n');
    });

    test('writes header to empty file', () => {
      fs.writeFileSync(logFile, '');

      ensureCsvHeader(logFile);

      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toBe(CSV_HEADER + '\n');
    });
  });

  describe('appendCsv', () => {
    test('appends process entries as CSV lines', () => {
      fs.writeFileSync(logFile, CSV_HEADER + '\n');

      const entries: ProcessInfo[] = [
        { pid: 123, user: 'dennis', rssMb: 500, vszMb: 1000, physMb: 480, command: 'claude' },
        { pid: 456, user: 'dennis', rssMb: 200, vszMb: 400, physMb: undefined, command: 'node app.js' },
      ];

      appendCsv(logFile, entries);

      const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[1]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},123,480,500,1000,claude$/);
      expect(lines[2]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},456,,200,400,node app.js$/);
    });

    test('does nothing for empty entries', () => {
      fs.writeFileSync(logFile, CSV_HEADER + '\n');

      appendCsv(logFile, []);

      const content = fs.readFileSync(logFile, 'utf-8');
      expect(content).toBe(CSV_HEADER + '\n');
    });
  });
});
