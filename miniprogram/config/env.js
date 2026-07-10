/**
 * Mini Program runtime profiles.
 * Set ACTIVE_ENV before compiling a release build.
 */
const ACTIVE_ENV = 'development'

const profiles = {
  development: {
    API_BASE_URL: 'http://localhost:8001/api',
    USE_API: true,
    REQUEST_TIMEOUT: 8000,
    STREAM_TIMEOUT: 120000
  },
  test: {
    API_BASE_URL: 'https://test-api.example.com/api',
    USE_API: true,
    REQUEST_TIMEOUT: 10000,
    STREAM_TIMEOUT: 120000
  },
  production: {
    API_BASE_URL: 'https://api.example.com/api',
    USE_API: true,
    REQUEST_TIMEOUT: 10000,
    STREAM_TIMEOUT: 120000
  }
}

const config = profiles[ACTIVE_ENV]

if (!config) throw new Error('Unknown Mini Program environment: ' + ACTIVE_ENV)
if (ACTIVE_ENV === 'production' && /example\.com|localhost/.test(config.API_BASE_URL)) {
  throw new Error('Configure the production HTTPS API_BASE_URL before release')
}

module.exports = Object.assign({ ENV_NAME: ACTIVE_ENV }, config)

