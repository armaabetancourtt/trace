import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ActivityKind } from '../features/activity/session/ActivitySessionMachine';
import { colors } from '../theme/tokens';

const OPTIONS: { value: ActivityKind; label: string }[] = [
  { value: 'run', label: 'RUN' },
  { value: 'walk', label: 'WALK' },
  { value: 'ride', label: 'RIDE' },
];

export function ActivityTypeSelector({
  value,
  onChange,
}: {
  value: ActivityKind;
  onChange: (value: ActivityKind) => void;
}) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, active && styles.activeOption]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  option: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeOption: {
    borderBottomWidth: 2,
    borderBottomColor: colors.live,
  },
  label: {
    color: colors.softGray,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  activeLabel: {
    color: colors.offWhite,
  },
});
