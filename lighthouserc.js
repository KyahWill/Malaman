module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/auth/login',
        'http://localhost:4173/auth/register',
        'http://localhost:4173/dashboard',
        'http://localhost:4173/courses',
        'http://localhost:4173/courses/create',
        'http://localhost:4173/assessments'
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': 'off',
        
        // Performance assertions
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        
        // Accessibility assertions
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'error',
        'meta-viewport': 'error',
        'button-name': 'error',
        'form-field-multiple-labels': 'error',
        'frame-title': 'error',
        'input-image-alt': 'error',
        'select-name': 'error',
        'skip-link': 'warn',
        'tabindex': 'error',
        'valid-lang': 'error',
        
        // Best practices assertions
        'uses-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'external-anchors-use-rel-noopener': 'error',
        'geolocation-on-start': 'error',
        'notification-on-start': 'error',
        'no-document-write': 'error',
        'paste-preventing-inputs': 'error',
        'password-inputs-can-be-pasted-into': 'error',
        
        // SEO assertions
        'document-title': 'error',
        'meta-description': 'warn',
        'http-status-code': 'error',
        'crawlable-anchors': 'error',
        'is-crawlable': 'error',
        'robots-txt': 'warn',
        'hreflang': 'off',
        'canonical': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: './lighthouse-results'
    }
  }
};