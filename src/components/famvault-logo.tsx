import { Image, StyleSheet, View } from 'react-native';

import { useVault } from '@/context/vault-context';

const LOGO_SOURCE = require('../../assets/images/icon.png');

interface FamvaultLogoProps {
  size: number;
  borderRadius: number;
}

/** Renders the Famvault Rose Gold diamond app logo inside a framed badge. */
export function FamvaultLogo({ size, borderRadius }: FamvaultLogoProps) {
  const { palette } = useVault();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          borderColor: palette.borderGold,
        },
      ]}
    >
      <Image source={LOGO_SOURCE} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
