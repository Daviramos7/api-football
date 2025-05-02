const API_HOST = 'api-football-v1.p.rapidapi.com';
const API_KEY = '102ffdcac2mshf9659b20ab7d7b7p1ea8bdjsnaa051d210b0b';

export async function fetchFromAPI(endpoint, version = 'v3') {
    try {
        const response = await fetch(`https://${API_HOST}/${version}/${endpoint}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': API_HOST,
                'x-rapidapi-key': API_KEY,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na API:', errorData);
            throw new Error(`Erro na API: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        console.log(`Resposta da API (${version}):`, data);
        return data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}