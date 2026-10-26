// Mirrors android/.../PointJson.kt. Times are epoch ms, durations seconds.

export interface SamsungHealthPointBase {
  uid: string;
  start_time: number;
  end_time?: number;
  zone_offset_s?: number;
  update_time?: number;
  /** Writer app (`com.sec.android.app.shealth` for Samsung Health itself). */
  app_id?: string;
  device_id?: string;
}

export interface ExerciseRoutePoint {
  t: number;
  lat: number;
  lng: number;
  alt?: number;
  accuracy?: number;
}

export interface ExerciseLogEntry {
  t: number;
  heart_rate?: number;
  cadence?: number;
  /** m/s */
  speed?: number;
  /** W */
  power?: number;
  count?: number;
}

export interface ExerciseSession {
  start_time: number;
  end_time: number;
  /** SDK `PredefinedExerciseType` name, e.g. `RUNNING`, `POOL_SWIMMING`. */
  exercise_type: string;
  duration_s: number;
  calories: number;
  /** m */
  distance?: number;
  altitude_gain?: number;
  altitude_loss?: number;
  min_altitude?: number;
  max_altitude?: number;
  mean_heart_rate?: number;
  max_heart_rate?: number;
  min_heart_rate?: number;
  mean_speed?: number;
  max_speed?: number;
  mean_cadence?: number;
  max_cadence?: number;
  mean_power?: number;
  max_power?: number;
  mean_rpm?: number;
  max_rpm?: number;
  incline_distance?: number;
  decline_distance?: number;
  count?: number;
  count_type: string;
  vo2max?: number;
  comment?: string;
  custom_title?: string;
  /** Only with the `exerciseLocation` permission. */
  route?: ExerciseRoutePoint[];
  log?: ExerciseLogEntry[];
  swimming?: {
    pool_length: number;
    pool_length_unit: 'meter' | 'yard';
    total_distance?: number;
    total_duration_s?: number;
  };
}

export interface ExercisePoint extends SamsungHealthPointBase {
  exercise_type?: string;
  custom_title?: string;
  /** Several sessions for multisport (e.g. triathlon). */
  sessions: ExerciseSession[];
}

export interface HeartRatePoint extends SamsungHealthPointBase {
  heart_rate?: number;
  min?: number;
  max?: number;
  series?: {
    start_time: number;
    end_time: number;
    heart_rate: number;
    min: number;
    max: number;
  }[];
}

export type SleepStage = 'UNDEFINED' | 'AWAKE' | 'LIGHT' | 'DEEP' | 'REM';

export interface SleepPoint extends SamsungHealthPointBase {
  duration_s?: number;
  sleep_score?: number;
  sessions: {
    start_time: number;
    end_time: number;
    duration_s: number;
    stages?: { start_time: number; end_time: number; stage: SleepStage }[];
  }[];
}

export interface BodyCompositionPoint extends SamsungHealthPointBase {
  /** kg */
  weight?: number;
  /** cm */
  height?: number;
  /** % */
  body_fat?: number;
  body_fat_mass?: number;
  fat_free?: number;
  fat_free_mass?: number;
  muscle_mass?: number;
  skeletal_muscle?: number;
  skeletal_muscle_mass?: number;
  /** L */
  total_body_water?: number;
  bmi?: number;
  /** kcal/day */
  basal_metabolic_rate?: number;
}

export interface BloodOxygenPoint extends SamsungHealthPointBase {
  /** % */
  spo2?: number;
  min?: number;
  max?: number;
}

export interface SamsungHealthPointMap {
  exercise: ExercisePoint;
  heartRate: HeartRatePoint;
  sleep: SleepPoint;
  bodyComposition: BodyCompositionPoint;
  bloodOxygen: BloodOxygenPoint;
}
