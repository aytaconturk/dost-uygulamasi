/**
 * Checks if the app is running in local development environment
 */
function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.includes('localhost');
}

/**
 * Extracts story ID from image path
 * @param imagePath - Image path like '/images/story1.png' or 'story1.png'
 * @returns Story ID or null if not found
 */
function extractStoryId(imagePath: string): number | null {
  const match = imagePath.match(/story(\d+)\.png/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Gets the full URL for a story image that works both locally and in production
 * @param imagePath - The image path (can be relative like '/images/story1.png' or full URL)
 * @returns Full URL that works in both local and production environments
 */
export function getStoryImageUrl(imagePath: string): string {
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Check if we're in local environment
  const isLocal = isLocalEnvironment();

  if (isLocal) {
    // In local environment, use GitHub raw URL
    const storyId = extractStoryId(imagePath);
    if (storyId) {
      return `https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story${storyId}.png`;
    }
    // If story ID not found, try to construct from path
    // Handle cases like '/images/story1.png' or 'story1.png'
    const pathMatch = imagePath.match(/story(\d+)\.png/i);
    if (pathMatch) {
      return `https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story${pathMatch[1]}.png`;
    }
  }

  // In production, use the app's own domain
  if (imagePath.startsWith('/')) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}${imagePath}`;
  }

  // If it's a relative path without /, add /images/ prefix
  const normalizedPath = imagePath.startsWith('images/') ? `/${imagePath}` : `/images/${imagePath}`;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Gets the story image path based on story ID
 * @param storyId - The story ID
 * @returns Image path like '/images/story1.png'
 */
export function getStoryImagePath(storyId: number): string {
  return `/images/story${storyId}.png`;
}

