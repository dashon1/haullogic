// Stub replacing @base44/sdk's axios client. Returns benign app public settings
// so the app boots in no-auth mode against our self-hosted Supabase backend.
export function createAxiosClient() {
  return {
    async get(url = '') {
      if (url.includes('public-settings')) {
        return { id: import.meta.env.VITE_APP_NAME || 'eventpix', public_settings: { requires_auth: false } };
      }
      return {};
    },
    async post() { return {}; },
    async put() { return {}; },
    async delete() { return {}; },
  };
}

export default createAxiosClient;
