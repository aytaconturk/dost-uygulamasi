/**
 * Gets the base URL for assets (handles GitHub Pages subdirectory)
 */
export function getAssetUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.replace(/^\/+/, '');
  const basePath = import.meta.env.BASE_URL || '/';
  return `${basePath}${cleanPath}`;
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
 * Uses GitHub raw URLs in ALL environments to ensure images always load correctly
 * @param imagePath - The image path (can be relative like '/images/story1.png' or full URL)
 * @returns Full GitHub raw URL for the story image
 */
export function getStoryImageUrl(imagePath: string): string {
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Always use GitHub raw URL for story images (both local and production)
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

  // For non-story images, fallback to GitHub raw URL with the original path
  // Remove leading slash if present
  const cleanPath = imagePath.replace(/^\/+/, '');
  return `https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/${cleanPath}`;
}

/**
 * Gets the story image path based on story ID
 * @param storyId - The story ID
 * @returns Image path like '/images/story1.png'
 */
export function getStoryImagePath(storyId: number): string {
  return `/images/story${storyId}.png`;
}

