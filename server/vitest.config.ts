import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Attachment tests share the server upload directory. Serial file execution
    // keeps filesystem fixtures and write-failure spies isolated from each other.
    fileParallelism: false,
  },
});
