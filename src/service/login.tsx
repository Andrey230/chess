const baseUrl = import.meta.env.VITE_ENDPOINT_BACKEND;

const login = async (username, password) => {

    try {
        const response = await fetch(baseUrl + 'api/login_check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) throw new Error('Failed to authenticate');

        const { token } = await response.json();
        localStorage.setItem('jwt', token);

        return token;
    } catch (error) {
        throw error;
    }
};

export default login;