package com.margelo.nitro.obitrain.samsunghealth

import com.samsung.android.sdk.health.data.data.HealthDataPoint
import com.samsung.android.sdk.health.data.data.entries.ExerciseSession
import com.samsung.android.sdk.health.data.data.entries.SleepSession
import com.samsung.android.sdk.health.data.request.DataType
import org.json.JSONArray
import org.json.JSONObject

// Wire shape mirrored by `SamsungHealthPoint` in src/types.ts. Times are epoch ms, durations
// seconds, units the SDK's canonical ones (m, m/s, kcal, kg, cm, %, bpm, W).
internal object PointJson {
  fun of(type: SamsungHealthPointType, point: HealthDataPoint): JSONObject {
    val json = JSONObject()
      .put("uid", point.uid)
      .put("start_time", point.startTime.toEpochMilli())
      .putOpt("end_time", point.endTime?.toEpochMilli())
      .putOpt("zone_offset_s", point.zoneOffset?.totalSeconds)
      .putOpt("update_time", point.updateTime?.toEpochMilli())
      .putOpt("app_id", point.dataSource?.appId)
      .putOpt("device_id", point.dataSource?.deviceId)
    when (type) {
      SamsungHealthPointType.EXERCISE -> exercise(point, json)
      SamsungHealthPointType.HEARTRATE -> heartRate(point, json)
      SamsungHealthPointType.SLEEP -> sleep(point, json)
      SamsungHealthPointType.BODYCOMPOSITION -> bodyComposition(point, json)
      SamsungHealthPointType.BLOODOXYGEN -> bloodOxygen(point, json)
    }
    return json
  }

  private fun exercise(point: HealthDataPoint, json: JSONObject) {
    json
      .putOpt("exercise_type", point.getValue(DataType.ExerciseType.EXERCISE_TYPE)?.name)
      .putOpt("custom_title", point.getValue(DataType.ExerciseType.CUSTOM_TITLE))
      .put("sessions", array(point.getValue(DataType.ExerciseType.SESSIONS), ::session))
  }

  private fun session(s: ExerciseSession): JSONObject = JSONObject()
    .put("start_time", s.startTime.toEpochMilli())
    .put("end_time", s.endTime.toEpochMilli())
    .put("exercise_type", s.exerciseType.name)
    .put("duration_s", s.duration.seconds)
    .put("calories", s.calories.toDouble())
    .putOpt("distance", s.distance?.toDouble())
    .putOpt("altitude_gain", s.altitudeGain?.toDouble())
    .putOpt("altitude_loss", s.altitudeLoss?.toDouble())
    .putOpt("min_altitude", s.minAltitude?.toDouble())
    .putOpt("max_altitude", s.maxAltitude?.toDouble())
    .putOpt("mean_heart_rate", s.meanHeartRate?.toDouble())
    .putOpt("max_heart_rate", s.maxHeartRate?.toDouble())
    .putOpt("min_heart_rate", s.minHeartRate?.toDouble())
    .putOpt("mean_speed", s.meanSpeed?.toDouble())
    .putOpt("max_speed", s.maxSpeed?.toDouble())
    .putOpt("mean_cadence", s.meanCadence?.toDouble())
    .putOpt("max_cadence", s.maxCadence?.toDouble())
    .putOpt("mean_power", s.meanPower?.toDouble())
    .putOpt("max_power", s.maxPower?.toDouble())
    .putOpt("mean_rpm", s.meanRpm?.toDouble())
    .putOpt("max_rpm", s.maxRpm?.toDouble())
    .putOpt("incline_distance", s.inclineDistance?.toDouble())
    .putOpt("decline_distance", s.declineDistance?.toDouble())
    .putOpt("count", s.count)
    .put("count_type", s.countType.name)
    .putOpt("vo2max", s.vo2Max?.toDouble())
    .putOpt("comment", s.comment)
    .putOpt("custom_title", s.customTitle)
    .putOpt("route", s.route?.let { route ->
      array(route) {
        JSONObject()
          .put("t", it.timestamp.toEpochMilli())
          .put("lat", it.latitude.toDouble())
          .put("lng", it.longitude.toDouble())
          .putOpt("alt", it.altitude?.toDouble())
          .putOpt("accuracy", it.accuracy?.toDouble())
      }
    })
    .putOpt("log", s.log?.let { log ->
      array(log) {
        JSONObject()
          .put("t", it.timestamp.toEpochMilli())
          .putOpt("heart_rate", it.heartRate?.toDouble())
          .putOpt("cadence", it.cadence?.toDouble())
          .putOpt("speed", it.speed?.toDouble())
          .putOpt("power", it.power?.toDouble())
          .putOpt("count", it.count)
      }
    })
    .putOpt("swimming", s.swimmingLog?.let {
      JSONObject()
        .put("pool_length", it.poolLength)
        .put("pool_length_unit", it.poolLengthUnit)
        .putOpt("total_distance", it.totalDistance?.toDouble())
        .putOpt("total_duration_s", it.totalDuration?.seconds)
    })

  private fun heartRate(point: HealthDataPoint, json: JSONObject) {
    json
      .putOpt("heart_rate", point.getValue(DataType.HeartRateType.HEART_RATE)?.toDouble())
      .putOpt("min", point.getValue(DataType.HeartRateType.MIN_HEART_RATE)?.toDouble())
      .putOpt("max", point.getValue(DataType.HeartRateType.MAX_HEART_RATE)?.toDouble())
      .putOpt("series", point.getValue(DataType.HeartRateType.SERIES_DATA)?.let { series ->
        array(series) {
          JSONObject()
            .put("start_time", it.startTime.toEpochMilli())
            .put("end_time", it.endTime.toEpochMilli())
            .put("heart_rate", it.heartRate.toDouble())
            .put("min", it.min.toDouble())
            .put("max", it.max.toDouble())
        }
      })
  }

  private fun sleep(point: HealthDataPoint, json: JSONObject) {
    json
      .putOpt("duration_s", point.getValue(DataType.SleepType.DURATION)?.seconds)
      .putOpt("sleep_score", point.getValue(DataType.SleepType.SLEEP_SCORE))
      .put("sessions", array(point.getValue(DataType.SleepType.SESSIONS), ::sleepSession))
  }

  private fun sleepSession(s: SleepSession): JSONObject = JSONObject()
    .put("start_time", s.startTime.toEpochMilli())
    .put("end_time", s.endTime.toEpochMilli())
    .put("duration_s", s.duration.seconds)
    .putOpt("stages", s.stages?.let { stages ->
      array(stages) {
        JSONObject()
          .put("start_time", it.startTime.toEpochMilli())
          .put("end_time", it.endTime.toEpochMilli())
          .put("stage", it.stage.name)
      }
    })

  private fun bodyComposition(point: HealthDataPoint, json: JSONObject) {
    json
      .putOpt("weight", point.getValue(DataType.BodyCompositionType.WEIGHT)?.toDouble())
      .putOpt("height", point.getValue(DataType.BodyCompositionType.HEIGHT)?.toDouble())
      .putOpt("body_fat", point.getValue(DataType.BodyCompositionType.BODY_FAT)?.toDouble())
      .putOpt("body_fat_mass", point.getValue(DataType.BodyCompositionType.BODY_FAT_MASS)?.toDouble())
      .putOpt("fat_free", point.getValue(DataType.BodyCompositionType.FAT_FREE)?.toDouble())
      .putOpt("fat_free_mass", point.getValue(DataType.BodyCompositionType.FAT_FREE_MASS)?.toDouble())
      .putOpt("muscle_mass", point.getValue(DataType.BodyCompositionType.MUSCLE_MASS)?.toDouble())
      .putOpt("skeletal_muscle", point.getValue(DataType.BodyCompositionType.SKELETAL_MUSCLE)?.toDouble())
      .putOpt(
        "skeletal_muscle_mass",
        point.getValue(DataType.BodyCompositionType.SKELETAL_MUSCLE_MASS)?.toDouble()
      )
      .putOpt("total_body_water", point.getValue(DataType.BodyCompositionType.TOTAL_BODY_WATER)?.toDouble())
      .putOpt("bmi", point.getValue(DataType.BodyCompositionType.BODY_MASS_INDEX)?.toDouble())
      .putOpt("basal_metabolic_rate", point.getValue(DataType.BodyCompositionType.BASAL_METABOLIC_RATE))
  }

  private fun bloodOxygen(point: HealthDataPoint, json: JSONObject) {
    json
      .putOpt("spo2", point.getValue(DataType.BloodOxygenType.OXYGEN_SATURATION)?.toDouble())
      .putOpt("min", point.getValue(DataType.BloodOxygenType.MIN_OXYGEN_SATURATION)?.toDouble())
      .putOpt("max", point.getValue(DataType.BloodOxygenType.MAX_OXYGEN_SATURATION)?.toDouble())
  }

  private fun <T> array(items: List<T>?, toJson: (T) -> JSONObject): JSONArray {
    val array = JSONArray()
    items?.forEach { array.put(toJson(it)) }
    return array
  }
}
