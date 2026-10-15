const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload'
const MAX_IMAGE_SIZE = 32 * 1024 * 1024
const MAX_OUTPUT_SIZE = 10 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 4096

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

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

async function sanitizeImage(file: File): Promise<File> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Please select a JPEG, PNG, or WebP image.')
  }

  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image must be larger than 0 bytes and no more than 32 MB.')
  }

  let bitmap: ImageBitmap | undefined

  try {
    bitmap = await createImageBitmap(file)

    if (
      bitmap.width === 0 ||
      bitmap.height === 0 ||
      bitmap.width > MAX_IMAGE_DIMENSION ||
      bitmap.height > MAX_IMAGE_DIMENSION
    ) {
      throw new Error('Image dimensions must not exceed 4096 × 4096 pixels.')
    }

    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Your browser could not process this image.')
    }

    context.drawImage(bitmap, 0, 0)

    const outputType =
      file.type === 'image/png' ? 'image/png' : 'image/jpeg'

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result)
          } else {
            reject(new Error('Could not re-encode this image.'))
          }
        },
        outputType,
        0.9,
      )
    })

    if (blob.size > MAX_OUTPUT_SIZE) {
      throw new Error('Processed image must be no more than 10 MB.')
    }

    const extension = outputType === 'image/png' ? 'png' : 'jpg'

    return new File([blob], `profile-image.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Image dimensions')) {
      throw error
    }

    throw new Error(
      'This file could not be decoded as a supported image. Please select a valid image.',
    )
  } finally {
    bitmap?.close()
  }
}

export async function uploadProfileImage(file: File): Promise<string> {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY?.trim()

  if (!apiKey) {
    throw new Error(
      'ImgBB API key is missing. Add VITE_IMGBB_API_KEY to .env.local and restart Vite.',
    )
  }

  const safeImage = await sanitizeImage(file)
  const formData = new FormData()

  formData.append('image', safeImage, safeImage.name)

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
    throw new Error(
      'Could not reach ImgBB. Check your connection and try again.',
    )
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

  let uploadedUrl: URL

  try {
    uploadedUrl = new URL(result.data.url)
  } catch {
    throw new Error('ImgBB returned an invalid image URL.')
  }

  if (
    uploadedUrl.protocol !== 'https:' ||
    uploadedUrl.hostname !== 'i.ibb.co'
  ) {
    throw new Error('ImgBB returned an unexpected image host.')
  }

  return uploadedUrl.toString()
}
