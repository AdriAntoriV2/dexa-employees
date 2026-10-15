const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload'
const MAX_IMAGE_SIZE = 32 * 1024 * 1024

interface ImgBBResponse {
    success: boolean
    data?: {
        url: string
        display_url: string
        delete_url: string
    }
    error?: {
        message?: string
    }
}

export async function uploadProfileImage(file: File): Promise<string> {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY?.trim()

    if (!apiKey) {
        throw new Error(
            'ImgBB API key is missing. Add VITE_IMGBB_API_KEY to .env.local and restart Vite.',
        )
    }

    if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.')
    }

    if (file.size > MAX_IMAGE_SIZE) {
        throw new Error('Image must be 32 MB or smaller.')
    }

    const formData = new FormData()
    formData.append('image', file)
    formData.append('name', file.name.replace(/\.[^.]+$/, ''))

    let response: Response

    try {
        response = await fetch(
            `${IMGBB_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                body: formData,
            },
        )
    } catch {
        throw new Error('Could not reach ImgBB. Check your connection and try again.')
    }

    let result: ImgBBResponse

    try {
        result = (await response.json()) as ImgBBResponse
    } catch {
        throw new Error('ImgBB returned an invalid response.')
    }

    if (!response.ok || !result.success || !result.data?.url) {
        throw new Error(
            result.error?.message ||
            `Image upload failed (${response.status}). Please try again.`,
        )
    }

    return result.data.url.replace(
        /^https:\/\/i\.ibb\.co(?=\/)/i,
        'https://i.ibb.co.com',
    )
}
