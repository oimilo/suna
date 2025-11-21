import * as React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';
import MiloSymbolBlack from '@/assets/brand/milo-symbol.svg';
import MiloSymbolWhite from '@/assets/brand/Symbol.svg';
import LogomarkBlack from '@/assets/brand/Logomark-Black.svg';
import LogomarkWhite from '@/assets/brand/Logomark-White.svg';

interface MiloLogoProps extends Omit<ViewProps, 'style'> {
  size?: number;
  variant?: 'symbol' | 'logomark';
  className?: string;
  style?: ViewStyle;
  color?: 'light' | 'dark';
}

export function MiloLogo({ 
  size = 24, 
  variant = 'symbol',
  className,
  style,
  color = 'dark',
  ...props 
}: MiloLogoProps) {
  const { colorScheme } = useColorScheme();
  
  const isDark = colorScheme === 'dark';

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    flexShrink: 0,
    ...style,
  };

  if (variant === 'logomark') {
    const LogomarkComponent = color === 'dark' ? LogomarkWhite : LogomarkBlack;
    return (
      <View 
        className={className}
        style={containerStyle}
        {...props}
      >
        <LogomarkComponent 
          width={size} 
          height={size}
          color={color}
        />
      </View>
    );
  }

  const SymbolComponent = color === 'dark' ? MiloSymbolWhite : MiloSymbolBlack;

  return (
    <View 
      className={className}
      style={containerStyle}
      {...props}
    >
      <SymbolComponent 
        width={size} 
        height={size}
      />
    </View>
  );
}

