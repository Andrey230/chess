const baseUrl = import.meta.env.VITE_ENDPOINT_BACKEND;

const signup = async (email, password) => {

    try {
        const response = await fetch(baseUrl + 'user-create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) throw new Error('Failed to signup');

        const data = await response.json();
        console.log(data);

        return data;
    } catch (error) {
        throw error;
    }
};

export default signup;