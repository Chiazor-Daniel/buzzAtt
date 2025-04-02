import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TabIconProps {
  name: string;
  color: string;
  size?: number;
}

export const TabIcon: React.FC<TabIconProps> = ({ name, color, size = 24 }) => (
  <Icon name={name} size={size} color={color} />
); 