import '@testing-library/jest-dom';

// jsdom에서 지원하지 않는 URL API mock
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();
