import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Monaco Editor component with React.createElement
vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange, language }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'monaco-editor', 'data-language': language },
        React.createElement('textarea', {
          'data-testid': 'monaco-textarea',
          value: value,
          onChange: (e: any) => onChange && onChange(e.target.value),
        })
      ),
  };
});
