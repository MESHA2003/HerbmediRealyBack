// Converts an imported image to a base64 data URL for use in print windows
// Uses fetch + FileReader instead of canvas to avoid CORS issues
export async function imageToBase64(imgUrl) {
    try {
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch {
        // Fallback: return original URL — may not show in print but won't break
        return imgUrl;
    }
}
