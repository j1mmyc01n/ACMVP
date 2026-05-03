import React from 'react';

const SafeIcon = ({ icon: Icon, className, size = 16, ...props }) => {
  if (!Icon) return null;
  return <Icon className={className} size={size} {...props} />;
};

export default SafeIcon;