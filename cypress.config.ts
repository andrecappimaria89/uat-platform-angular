import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl:         'http://localhost:4200',
    specPattern:     'cypress/e2e/**/*.cy.ts',
    supportFile:     false,
    video:           false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    setupNodeEvents(on, config) {
      on('task', {
        fileExists(filename: string) {
          const fs   = require('fs')
          const path = require('path')
          return fs.existsSync(path.join(process.cwd(), filename))
        },
      })
    },
  },
})
