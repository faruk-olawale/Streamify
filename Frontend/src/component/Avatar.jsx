import { useState } from 'react';
import { getInitials } from '../utils/avatar-helper';

/**
 * Reusable Avatar Component with automatic fallback
 * Shows image if available, otherwise shows initials
 */
const Avatar = ({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  showRing = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Size mappings
  const sizeClasses = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
    '2xl': 'w-32 h-32 text-3xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  const ringClass = showRing 
    ? 'ring ring-primary ring-offset-base-100 ring-offset-2' 
    : '';

  // Generate gradient background based on name
  const getGradientFromName = (name) => {
    const gradients = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-teal-500',
      'from-pink-500 to-rose-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-blue-500',
      'from-purple-500 to-pink-500',
      'from-yellow-500 to-orange-500',
      'from-teal-500 to-cyan-500',
    ];
    
    if (!name) return gradients[0];
    
    // Use first character code to pick gradient
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const gradient = getGradientFromName(alt);
  const initials = getInitials(alt);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <div className={`avatar ${className}`}>
      <div className={`${sizeClass} rounded-full ${ringClass} bg-base-300 overflow-hidden`}>
        {src && !imageError ? (
          <>
            {imageLoading && (
              <div className={`flex items-center justify-center h-full w-full bg-gradient-to-br ${gradient}`}>
                <span className="loading loading-spinner loading-sm text-white"></span>
              </div>
            )}
            <img
              src={src}
              alt={alt || 'Avatar'}
              onError={handleImageError}
              onLoad={handleImageLoad}
              className={`w-full h-full object-cover ${imageLoading ? 'hidden' : ''}`}
            />
          </>
        ) : (
          <div className={`flex items-center justify-center h-full w-full bg-gradient-to-br ${gradient}`}>
            <span className="font-bold text-white">
              {initials}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Avatar;