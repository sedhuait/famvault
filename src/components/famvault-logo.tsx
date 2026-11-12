import { Image, StyleSheet, View } from 'react-native';

const LOGO_SOURCE = require('../../assets/images/splash-icon.png');

interface FamvaultLogoProps {
  size: number;
  borderRadius?: number;
}

/** Renders the transparent-background Famvault Rose Gold diamond logo. */
export function FamvaultLogo({ size }: FamvaultLogoProps) {
  const imageSize = Math.round(size * 1.3);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={LOGO_SOURCE}
        style={{ width: imageSize, height: imageSize }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
