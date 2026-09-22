import type { PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { colors } from '../theme/tokens';

type Props = PropsWithChildren<
  PressableProps & {
    tone?: 'primary' | 'secondary';
  }
>;

export function TraceButton({
  children,
  tone = 'primary',
  style,
  ...props
}: Props) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        tone === 'primary' ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === 'primary' ? styles.primaryLabel : styles.secondaryLabel,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primary: {
    backgroundColor: colors.live,
  },
  secondary: {
    backgroundColor: colors.offWhite,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  primaryLabel: {
    color: colors.black,
  },
  secondaryLabel: {
    color: colors.black,
  },
});
