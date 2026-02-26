import api from "./api";

interface ProposeThesisRequest {
    title: string;
    shortDescription?: string;
    file: File;
}

export const thesisService = {
    proposeThesis: async (data: ProposeThesisRequest) => {
        const formData = new FormData();
        formData.append('Title', data.title);
        if (data.shortDescription) {
            formData.append('ShortDescription', data.shortDescription);
        }
        formData.append('File', data.file);

        // We use the regular axios instance directly, or the api instance but override headers
        // so that the multipart boundary is correctly set by the browser.
        const response = await api.post('/thesis/propose', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};
