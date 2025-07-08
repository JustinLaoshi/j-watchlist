// Helper function to handle API errors.
export const handleApiError = async (
	response: Response,
	defaultMessage: string
): Promise<never> => {
	let errorMessage = defaultMessage;
	try {
		const errorData = await response.json();
		errorMessage = errorData.error?.message || errorMessage;
	} catch {
		errorMessage = `${defaultMessage}: ${response.status}`;
	}
	throw new Error(errorMessage);
};

// Helper function to extract items from API response.
export const extractItemsFromResponse = (data: any): any[] => {
	if (Array.isArray(data)) return data;
	if (data.data && Array.isArray(data.data)) return data.data;
	if (data.data?.items && Array.isArray(data.data.items)) return data.data.items;
	return [];
};
