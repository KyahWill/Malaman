import { dev } from '$app/environment';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { OPENAI_API_KEY, AI_MODEL } from '$env/static/private';

export interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  ai: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    baseUrl: string;
  };
  features: {
    aiAssessments: boolean;
    adaptiveRoadmaps: boolean;
    analytics: boolean;
    mediaUpload: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  performance: {
    cacheEnabled: boolean;
    cdnEnabled: boolean;
    compressionEnabled: boolean;
  };
  security: {
    encryptionEnabled: boolean;
    auditLoggingEnabled: boolean;
    rateLimitingEnabled: boolean;
  };
}

function getEnvironment(): 'development' | 'staging' | 'production' {
  if (dev) return 'development';
  
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (hostname.includes('staging') || hostname.includes('preview')) {
    return 'staging';
  }
  
  return 'production';
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  const environment = getEnvironment();
  switch (environment) {
    case 'production':
      return 'https://your-production-domain.com';
    case 'staging':
      return 'https://staging.your-domain.com';
    default:
      return 'http://localhost:5173';
  }
}

export const config: EnvironmentConfig = {
  supabase: {
    url: PUBLIC_SUPABASE_URL,
    anonKey: PUBLIC_SUPABASE_ANON_KEY,
  },
  ai: {
    apiKey: OPENAI_API_KEY || '',
    model: AI_MODEL || 'gpt-4',
    enabled: !!OPENAI_API_KEY,
  },
  app: {
    name: 'Personalized LMS',
    version: '1.0.0',
    environment: getEnvironment(),
    baseUrl: getBaseUrl(),
  },
  features: {
    aiAssessments: getEnvironment() !== 'development' || !!OPENAI_API_KEY,
    adaptiveRoadmaps: getEnvironment() !== 'development' || !!OPENAI_API_KEY,
    analytics: true,
    mediaUpload: true,
  },
  monitoring: {
    enabled: getEnvironment() === 'production',
    logLevel: getEnvironment() === 'production' ? 'warn' : 'debug',
  },
  performance: {
    cacheEnabled: getEnvironment() !== 'development',
    cdnEnabled: getEnvironment() === 'production',
    compressionEnabled: getEnvironment() !== 'development',
  },
  security: {
    encryptionEnabled: true,
    auditLoggingEnabled: getEnvironment() !== 'development',
    rateLimitingEnabled: getEnvironment() !== 'development',
  },
};

export function isProduction(): boolean {
  return config.app.environment === 'production';
}

export function isStaging(): boolean {
  return config.app.environment === 'staging';
}

export function isDevelopment(): boolean {
  return config.app.environment === 'development';
}

export function getFeatureFlag(feature: keyof EnvironmentConfig['features']): boolean {
  return config.features[feature];
}

export function getLogLevel(): string {
  return config.monitoring.logLevel;
}