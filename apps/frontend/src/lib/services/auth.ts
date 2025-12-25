export async function fetchWithAuth(url: string | URL, options: RequestInit = {}) {
    // In a real app we'd get this from a proper auth store/context or Keycloak adapter
    // For this MVP stage, we rely on localStorage as set up in previous prompts (or assumed)
    const token = localStorage.getItem('auth_token');
    
    // Use plain object for easier testing and compatibility
    const headers: Record<string, string> = { 
        ...(options.headers as Record<string, string> || {}) 
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    return fetch(url, config);
}

export async function fetchCurrentUser() {
    const res = await fetchWithAuth('/api/users/me');
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
}
