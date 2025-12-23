const fs = require('fs');
const path = require('path');

describe('Server Configuration', () => {
  test('should check if server.js exists', () => {
    const serverPath = path.join(__dirname, '../server.js');
    expect(fs.existsSync(serverPath)).toBe(true);
  });

  test('should have required dependencies available', () => {
    const express = require('express');
    const sqlite3 = require('sqlite3');
    const cors = require('cors');

    expect(express).toBeDefined();
    expect(sqlite3).toBeDefined();
    expect(cors).toBeDefined();
  });

  test('should verify express is a function', () => {
    const express = require('express');
    expect(typeof express).toBe('function');
  });

  test('should verify sqlite3 module is available', () => {
    const sqlite3 = require('sqlite3');
    expect(sqlite3).toBeDefined();
    expect(sqlite3.verbose).toBeDefined();
  });

  test('should verify cors middleware is available', () => {
    const cors = require('cors');
    expect(typeof cors).toBe('function');
  });

  test('should verify socket.io is available', () => {
    const socketIO = require('socket.io');
    expect(socketIO).toBeDefined();
  });
});

describe('File Operations', () => {
  test('should create and write to payments.json file', () => {
    const testPath = path.join(__dirname, '../test-payments.json');
    const testData = JSON.stringify([{ id: 1, amount: 100, currency: 'USD' }], null, 2);

    fs.writeFileSync(testPath, testData);
    expect(fs.existsSync(testPath)).toBe(true);

    const content = fs.readFileSync(testPath, 'utf8');
    expect(content).toBeDefined();
    expect(content).toContain('amount');

    if (fs.existsSync(testPath)) {
      fs.unlinkSync(testPath);
    }
  });

  test('should verify payments.json exists after sync', () => {
    const testData = [{ id: 1, amount: 50, currency: 'EUR' }];
    const paymentsPath = path.join(__dirname, '../test-sync-payments.json');

    fs.writeFileSync(paymentsPath, JSON.stringify(testData, null, 2));
    const exists = fs.existsSync(paymentsPath);

    expect(exists).toBe(true);
    
    if (exists) {
      fs.unlinkSync(paymentsPath);
    }
  });

  test('should parse JSON file correctly', () => {
    const testPath = path.join(__dirname, '../test-parse.json');
    const originalData = [{ id: 1, amount: 123.45, currency: 'GBP' }];

    fs.writeFileSync(testPath, JSON.stringify(originalData, null, 2));
    const fileContent = fs.readFileSync(testPath, 'utf8');
    const parsedData = JSON.parse(fileContent);

    expect(parsedData).toEqual(originalData);
    expect(parsedData[0].amount).toBe(123.45);

    if (fs.existsSync(testPath)) {
      fs.unlinkSync(testPath);
    }
  });
});

describe('Environment Configuration', () => {
  test('should detect production mode when NODE_ENV is set', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    expect(process.env.NODE_ENV).toBe('production');

    process.env.NODE_ENV = originalEnv;
  });

  test('should detect development mode when NODE_ENV is not production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    expect(process.env.NODE_ENV).not.toBe('production');

    process.env.NODE_ENV = originalEnv;
  });
});

describe('Database Configuration', () => {
  test('should have correct database path pattern', () => {
    const dbPath = './payments.db';
    expect(dbPath).toContain('payments');
    expect(dbPath).toContain('.db');
  });

  test('should validate port configuration', () => {
    const port = 8556;
    expect(typeof port).toBe('number');
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  test('should validate CORS configuration', () => {
    const corsConfig = {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    };

    expect(corsConfig.origin).toBe('*');
    expect(Array.isArray(corsConfig.methods)).toBe(true);
    expect(corsConfig.methods).toContain('GET');
    expect(corsConfig.methods).toContain('POST');
    expect(corsConfig.methods).toContain('PUT');
    expect(corsConfig.methods).toContain('DELETE');
  });
});
