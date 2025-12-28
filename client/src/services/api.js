const BASE_URL = import.meta.env.VITE_API_URL || '';

export const fetchApi = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;

    // Ensure relative URLs are handled correctly if BASE_URL is empty (local dev)
    const finalUrl = url.startsWith('/') ? url : `/${url}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(finalUrl, defaultOptions);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`API Request failed: ${response.status}`);
    }

    return response.json();
};
