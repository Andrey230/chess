const baseUrl = import.meta.env.VITE_ENDPOINT_BACKEND;

export const fetchWithAuth = async (url, { method = 'GET', body = null, headers = {}, ...options } = {}) => {
    const token = localStorage.getItem('jwt');
    const finalUrl = baseUrl + url;

    // Добавляем заголовки и токен авторизации
    const finalHeaders = {
        ...headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': body ? 'application/json' : headers['Content-Type'], // Устанавливаем Content-Type, если есть body
    };

    // Преобразуем body в строку JSON, если это объект
    const finalBody = body && typeof body === 'object' ? JSON.stringify(body) : body;

    return fetch(finalUrl, {
        method,
        headers: finalHeaders,
        body: finalBody,
        ...options,
    });
};