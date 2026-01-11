/**
 * Reliable Avatar Generator Utility
 * Provides multiple fallback options for avatar generation
 */

/**
 * Generate avatar URL using UI Avatars (most reliable)
 * This service generates initials-based avatars
 */
export function generateUIAvatar(name, options = {}) {
  const {
    size = 200,
    background = 'random',
    color = 'fff',
    bold = true,
    rounded = false
  } = options;

  const params = new URLSearchParams({
    name: name || 'User',
    size: size.toString(),
    background: background,
    color: color,
    bold: bold.toString(),
    rounded: rounded.toString()
  });

  return `https://ui-avatars.com/api/?${params.toString()}`;
}

/**
 * Generate DiceBear avatar (cartoon style)
 */
export function generateDiceBearAvatar(seed, style = 'avataaars') {
  // Available styles: avataaars, bottts, personas, pixel-art, lorelei, etc.
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Generate Boring Avatars (abstract geometric patterns)
 */
export function generateBoringAvatar(seed, variant = 'beam') {
  // Available variants: marble, beam, pixel, sunset, ring, bauhaus
  const colors = ['264653', '2a9d8f', 'e9c46a', 'f4a261', 'e76f51'];
  return `https://source.boringavatars.com/${variant}/200/${encodeURIComponent(seed)}?colors=${colors.join(',')}`;
}

/**
 * Generate Gravatar (if user has one)
 */
export function generateGravatar(email) {
  // This requires email hash, but provides fallback
  const hash = email ? btoa(email.toLowerCase().trim()) : 'default';
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
}

/**
 * Generate random avatar with automatic fallback
 * This is the main function you should use
 */
export function generateRandomAvatar(identifier, style = 'ui-avatars') {
  const seed = identifier || `user${Math.floor(Math.random() * 10000)}`;
  
  switch (style) {
    case 'ui-avatars':
      return generateUIAvatar(seed);
    
    case 'dicebear':
      return generateDiceBearAvatar(seed, 'avataaars');
    
    case 'dicebear-pixel':
      return generateDiceBearAvatar(seed, 'pixel-art');
    
    case 'dicebear-bottts':
      return generateDiceBearAvatar(seed, 'bottts');
    
    case 'boring':
      return generateBoringAvatar(seed, 'beam');
    
    case 'boring-marble':
      return generateBoringAvatar(seed, 'marble');
    
    default:
      return generateUIAvatar(seed);
  }
}

/**
 * Get random color for gradient backgrounds
 */
export function getRandomGradient() {
  const gradients = [
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-pink-500 to-rose-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-blue-500',
    'from-purple-500 to-pink-500',
    'from-yellow-500 to-orange-500',
    'from-teal-500 to-green-500',
  ];
  
  return gradients[Math.floor(Math.random() * gradients.length)];
}

/**
 * Create initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Avatar component fallback - returns JSX for initial-based avatar
 */
export function createFallbackAvatar(name, className = '') {
  const initials = getInitials(name);
  const gradient = getRandomGradient();
  
  return {
    initials,
    gradient,
    className
  };
}