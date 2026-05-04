import React from 'react';

const SafeIcon = ({ icon: Icon, className, size = 16, label, ...props }) => {
  if (!Icon) return null;
  const a11yProps = label
    ? { role: 'img', 'aria-label': label }
    : { 'aria-hidden': true, focusable: false };
  return <Icon className={className} size={size} {...a11yProps} {...props} />;
};

export default SafeIcon;
