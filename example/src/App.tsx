import { useCallback, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SamsungHealth,
  toSamsungHealthError,
  type SamsungHealthDataType,
} from '@obitrain/react-native-samsung-health';

const ALL_TYPES: SamsungHealthDataType[] = [
  'exercise',
  'exerciseLocation',
  'heartRate',
  'sleep',
  'steps',
  'activitySummary',
  'floorsClimbed',
  'bodyComposition',
  'bloodOxygen',
];

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export default function App() {
  const [log, setLog] = useState<string[]>([]);

  const run = useCallback(
    async (label: string, action: () => Promise<unknown>) => {
      try {
        const result = await action();
        const line = `${label}: ${JSON.stringify(result, null, 1).slice(0, 2000)}`;
        console.log(`[obi-samsung-health] ${line}`);
        setLog((prev) => [line, ...prev]);
      } catch (e) {
        const error = toSamsungHealthError(e);
        setLog((prev) => [
          `${label} failed [${error.code}]: ${error.message}`,
          ...prev,
        ]);
      }
    },
    []
  );

  const now = Date.now();
  const actions: [string, () => Promise<unknown>][] = [
    ['getStatus', () => SamsungHealth.getStatus()],
    ['resolveStatus', () => SamsungHealth.resolveStatus()],
    ['requestPermissions', () => SamsungHealth.requestPermissions(ALL_TYPES)],
    [
      'getGrantedPermissions',
      () => SamsungHealth.getGrantedPermissions(ALL_TYPES),
    ],
    [
      'exercises (7 days)',
      () =>
        SamsungHealth.readData('exercise', {
          startMs: now - 7 * DAY_MS,
          endMs: now,
        }),
    ],
    [
      'sleep (7 days)',
      () =>
        SamsungHealth.readData('sleep', {
          startMs: now - 7 * DAY_MS,
          endMs: now,
        }),
    ],
    [
      'exercise changes (1 day)',
      () =>
        SamsungHealth.readChanges('exercise', {
          startMs: now - DAY_MS,
          endMs: now,
        }),
    ],
    [
      'daily steps (7 days)',
      () =>
        SamsungHealth.aggregateDaily(
          'steps',
          isoDate(new Date(now - 6 * DAY_MS)),
          isoDate(new Date(now))
        ),
    ],
    [
      'daily active calories (7 days)',
      () =>
        SamsungHealth.aggregateDaily(
          'activeCalories',
          isoDate(new Date(now - 6 * DAY_MS)),
          isoDate(new Date(now))
        ),
    ],
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>obi-samsung-health</Text>
      <View style={styles.buttons}>
        {actions.map(([label, action]) => (
          <TouchableOpacity
            key={label}
            style={styles.button}
            onPress={() => run(label, action)}
          >
            <Text style={styles.buttonText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.log}>
        {log.map((line, i) => (
          <Text key={i} style={styles.logLine} selectable>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    backgroundColor: '#1259c3',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  buttonText: { color: '#fff', fontSize: 13 },
  log: { marginTop: 16, flex: 1 },
  logLine: {
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 8,
    color: '#222',
  },
});
