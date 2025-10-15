// https://nuxt.com/docs/api/configuration/nuxt-config
const authOrigin = (process.env.AUTH_ORIGIN ?? 'http://localhost:3000').replace(/\/$/, '')

export default defineNuxtConfig({
  srcDir: 'app',
  serverDir: 'app/server',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@sidebase/nuxt-auth'],
  auth: {
    isEnabled: true,
    disableServerSideAuth: false,
    disableInternalRouting: true,
    originEnvKey: false,
    baseURL: `${authOrigin}/api/auth`,
    provider: {
      type: 'authjs'
    },
    sessionRefresh: {
      enablePeriodically: true,
      enableOnWindowFocus: true
    },
    trustHost: true
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    authSecret: process.env.AUTH_SECRET,
    authTrustHost: process.env.AUTH_TRUST_HOST,
    authOrigin: process.env.AUTH_ORIGIN,
    public: {}
  },
  appConfig: {
    env: {
      DATABASE_URL: process.env.DATABASE_URL
    }
  },
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Content-Security-Policy':
            [
              "default-src 'self'",
              "img-src 'self' data: https: http:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "connect-src 'self' https: http: ws:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; '),
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
        }
      }
    }
  }
})
