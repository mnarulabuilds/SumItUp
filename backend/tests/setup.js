// Test setup file to mock problematic dependencies
const Module = require('module');
const originalRequire = Module.prototype.require;
// Register ts-node to handle TypeScript files with proper settings
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  }
});

// Mock DeepSpeech module
Module.prototype.require = function(id) {
  if (id === 'deepspeech') {
    return require('./mocks/deepspeech');
  }
  
  // Call original require
  const module = originalRequire.apply(this, arguments);
  
  // Only handle ES6 default exports from our own TypeScript source files
  // Check if this is a path to our src directory
  const isOurSourceFile = id.includes('../src/') || id.includes('src/');
  
  if (isOurSourceFile && module && module.__esModule && module.default) {
    // Don't unwrap if it's already been unwrapped or if it's a complex module with named exports
    // Only unwrap if default is the primary export
    const hasOtherExports = Object.keys(module).filter(k => k !== 'default' && k !== '__esModule').length > 0;
    if (!hasOtherExports) {
      return module.default;
    }
  }
  
  return module;
};

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
process.env.MONGODB_URI = 'mongodb://localhost:27017/sumitup-test';

// Helper function to create valid MongoDB ObjectIds for tests
// Lazy-load mongoose to avoid module loading issues
global.createObjectId = function(id) {
  // If id is already a valid 24-char hex string, use it
  if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
    return id;
  }
  // Otherwise, create a new ObjectId and return as string
  const mongoose = require('mongoose');
  return new mongoose.Types.ObjectId().toString();
};
