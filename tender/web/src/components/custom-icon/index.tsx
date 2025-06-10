import React from 'react';

interface CustomIconProps {
  src: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  alt?: string;
  onClick?: () => void;
}

const CustomIcon: React.FC<CustomIconProps> = ({
  src,
  width = 22,
  height = 22,
  className = '',
  alt = '',
  onClick,
}) => {
  return (
    <img
      src={src}
      width={width}
      height={height}
      className={className}
      alt={alt}
      onClick={onClick}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default CustomIcon;
