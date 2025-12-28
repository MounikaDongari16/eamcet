const BASE_URL = import.meta.env.VITE_API_URL || '';

export const fetchApi = async (endpoint, options = {}) => {
    // Prevent double slashes and handle trailing slashes in BASE_URL
    const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${cleanBase}${cleanEndpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`API Request failed: ${response.status}`);
    }

    return response.json();
};
