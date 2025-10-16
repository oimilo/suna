// Environment variable check utility
export const checkEnvironmentVariables = () => {
  const envVars = {
    NEXT_PUBLIC_ENV_MODE: process.env.NEXT_PUBLIC_ENV_MODE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  };
  if (process.env.NODE_ENV !== 'production') {
    console.log('Environment Variables Check:', envVars);
  }

  // Check if backend URL is properly set
  if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('WARNING: NEXT_PUBLIC_BACKEND_URL is not set!');
    }
  }

  return envVars;
};

// Export the backend URL with a fallback
export const getBackendUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    console.error('NEXT_PUBLIC_BACKEND_URL is not defined, API calls will fail');
  }
  return url || '';
};