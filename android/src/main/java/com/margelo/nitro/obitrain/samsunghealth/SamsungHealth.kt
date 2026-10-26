package com.margelo.nitro.obitrain.samsunghealth

import android.app.Activity
import android.os.Build
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.samsung.android.sdk.health.data.HealthDataService
import com.samsung.android.sdk.health.data.HealthDataStore
import com.samsung.android.sdk.health.data.data.ChangeType
import com.samsung.android.sdk.health.data.error.ErrorCode
import com.samsung.android.sdk.health.data.error.HealthDataException
import com.samsung.android.sdk.health.data.error.ResolvablePlatformException
import com.samsung.android.sdk.health.data.permission.AccessType
import com.samsung.android.sdk.health.data.permission.Permission
import com.samsung.android.sdk.health.data.data.AggregateOperation
import com.samsung.android.sdk.health.data.request.AggregateRequest
import com.samsung.android.sdk.health.data.request.DataType
import com.samsung.android.sdk.health.data.request.DataTypes
import com.samsung.android.sdk.health.data.request.InstantTimeFilter
import com.samsung.android.sdk.health.data.request.LocalTimeFilter
import com.samsung.android.sdk.health.data.request.LocalTimeGroup
import com.samsung.android.sdk.health.data.request.LocalTimeGroupUnit
import com.samsung.android.sdk.health.data.request.Ordering
import java.time.Instant
import java.time.LocalDate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray

@Keep
@DoNotStrip
class SamsungHealth @DoNotStrip constructor() : HybridSamsungHealthSpec() {
  // Lazily created: getStore throws on devices without Samsung Health.
  private var _store: HealthDataStore? = null

  private fun store(): HealthDataStore {
    _store?.let { return it }
    val context = NitroModules.applicationContext ?: throw IllegalStateException("No React context")
    return HealthDataService.getStore(context).also { _store = it }
  }

  private fun currentActivity(): Activity =
    NitroModules.applicationContext?.currentActivity
      ?: throw IllegalStateException("No foreground activity")

  override fun getStatus(): Promise<SamsungHealthStatus> = Promise.async {
    if (Build.VERSION.SDK_INT < MIN_SDK) return@async SamsungHealthStatus.UNSUPPORTEDDEVICE
    try {
      store().getGrantedPermissions(setOf(STATUS_PROBE))
      SamsungHealthStatus.AVAILABLE
    } catch (e: HealthDataException) {
      statusOf(e) ?: throw sdkError(e)
    }
  }

  override fun resolveStatus(): Promise<Unit> = Promise.async {
    if (Build.VERSION.SDK_INT < MIN_SDK) return@async
    try {
      store().getGrantedPermissions(setOf(STATUS_PROBE))
    } catch (e: ResolvablePlatformException) {
      if (!e.hasResolution) throw sdkError(e)
      val activity = currentActivity()
      withContext(Dispatchers.Main) { e.resolve(activity) }
    } catch (e: HealthDataException) {
      throw sdkError(e)
    }
  }

  override fun getGrantedPermissions(
    types: Array<SamsungHealthDataType>
  ): Promise<Array<SamsungHealthDataType>> = Promise.async {
    sdkCall { grantedTypes(types, store().getGrantedPermissions(permissionsOf(types))) }
  }

  override fun requestPermissions(
    types: Array<SamsungHealthDataType>
  ): Promise<Array<SamsungHealthDataType>> = Promise.async {
    sdkCall {
      val permissions = permissionsOf(types)
      val granted = store().getGrantedPermissions(permissions)
      if (granted.containsAll(permissions)) return@sdkCall grantedTypes(types, granted)
      grantedTypes(types, store().requestPermissions(permissions, currentActivity()))
    }
  }

  override fun readData(
    type: SamsungHealthPointType,
    startMs: Double,
    endMs: Double,
    pageSize: Double,
    pageToken: String?
  ): Promise<DataPage> = Promise.async {
    sdkCall {
      val filter = InstantTimeFilter.of(Instant.ofEpochMilli(startMs.toLong()), Instant.ofEpochMilli(endMs.toLong()))
      val request = readBuilder(type)
        .setInstantTimeFilter(filter)
        .setOrdering(Ordering.ASC)
        .setPageSize(pageSize.toInt())
        .setPageToken(pageToken)
        .build()
      val response = store().readData(request)
      val points = JSONArray()
      response.dataList.forEach { points.put(PointJson.of(type, it)) }
      DataPage(pointsJson = points.toString(), nextPageToken = response.pageToken)
    }
  }

  override fun readChanges(
    type: SamsungHealthPointType,
    startMs: Double,
    endMs: Double,
    pageSize: Double,
    pageToken: String?
  ): Promise<ChangesPage> = Promise.async {
    sdkCall {
      val filter = InstantTimeFilter.of(Instant.ofEpochMilli(startMs.toLong()), Instant.ofEpochMilli(endMs.toLong()))
      val request = changesBuilder(type)
        .setChangeTimeFilter(filter)
        .setPageSize(pageSize.toInt())
        .setPageToken(pageToken)
        .build()
      val response = store().readChanges(request)
      val upserts = JSONArray()
      val deleted = mutableListOf<String>()
      response.dataList.forEach { change ->
        if (change.changeType == ChangeType.DELETE) {
          change.deleteDataUid?.let(deleted::add)
        } else {
          change.upsertDataPoint?.let { upserts.put(PointJson.of(type, it)) }
        }
      }
      ChangesPage(
        upsertsJson = upserts.toString(),
        deletedUids = deleted.toTypedArray(),
        nextPageToken = response.pageToken
      )
    }
  }

  override fun aggregateDaily(
    metric: SamsungHealthDailyMetric,
    startDate: String,
    endDate: String
  ): Promise<Array<DailyValue>> = Promise.async {
    sdkCall {
      val filter = LocalTimeFilter.of(
        LocalDate.parse(startDate).atStartOfDay(),
        LocalDate.parse(endDate).plusDays(1).atStartOfDay()
      )
      when (metric) {
        SamsungHealthDailyMetric.STEPS -> daily(DataType.StepsType.TOTAL, filter) { it.toDouble() }
        SamsungHealthDailyMetric.ACTIVECALORIES ->
          daily(DataType.ActivitySummaryType.TOTAL_ACTIVE_CALORIES_BURNED, filter) { it.toDouble() }
        SamsungHealthDailyMetric.TOTALCALORIES ->
          daily(DataType.ActivitySummaryType.TOTAL_CALORIES_BURNED, filter) { it.toDouble() }
        SamsungHealthDailyMetric.DISTANCE ->
          daily(DataType.ActivitySummaryType.TOTAL_DISTANCE, filter) { it.toDouble() }
        SamsungHealthDailyMetric.ACTIVETIME ->
          daily(DataType.ActivitySummaryType.TOTAL_ACTIVE_TIME, filter) { it.seconds.toDouble() }
        SamsungHealthDailyMetric.FLOORSCLIMBED ->
          daily(DataType.FloorsClimbedType.TOTAL, filter) { it.toDouble() }
      }.toTypedArray()
    }
  }

  private suspend fun <T : Any> daily(
    operation: AggregateOperation<T, AggregateRequest.LocalTimeBuilder<T>>,
    filter: LocalTimeFilter,
    toValue: (T) -> Double
  ): List<DailyValue> {
    val request = operation.requestBuilder
      .setLocalTimeFilterWithGroup(filter, LocalTimeGroup.of(LocalTimeGroupUnit.DAILY, 1))
      .setOrdering(Ordering.ASC)
      .build()
    return store().aggregateData(request).dataList.mapNotNull { bucket ->
      bucket.value?.let { DailyValue(bucket.getStartLocalDateTime().toLocalDate().toString(), toValue(it)) }
    }
  }

  private inline fun <T> sdkCall(block: () -> T): T {
    if (Build.VERSION.SDK_INT < MIN_SDK) throw IllegalStateException("Samsung Health requires Android 10+")
    try {
      return block()
    } catch (e: HealthDataException) {
      throw sdkError(e)
    }
  }

  companion object {
    private const val MIN_SDK = Build.VERSION_CODES.Q

    private val STATUS_PROBE = Permission.of(DataTypes.STEPS, AccessType.READ)

    private fun dataTypeOf(type: SamsungHealthDataType): DataType = when (type) {
      SamsungHealthDataType.EXERCISE -> DataTypes.EXERCISE
      SamsungHealthDataType.EXERCISELOCATION -> DataTypes.EXERCISE_LOCATION
      SamsungHealthDataType.HEARTRATE -> DataTypes.HEART_RATE
      SamsungHealthDataType.SLEEP -> DataTypes.SLEEP
      SamsungHealthDataType.STEPS -> DataTypes.STEPS
      SamsungHealthDataType.ACTIVITYSUMMARY -> DataTypes.ACTIVITY_SUMMARY
      SamsungHealthDataType.FLOORSCLIMBED -> DataTypes.FLOORS_CLIMBED
      SamsungHealthDataType.BODYCOMPOSITION -> DataTypes.BODY_COMPOSITION
      SamsungHealthDataType.BLOODOXYGEN -> DataTypes.BLOOD_OXYGEN
    }

    private fun permissionsOf(types: Array<SamsungHealthDataType>): Set<Permission> =
      types.map { Permission.of(dataTypeOf(it), AccessType.READ) }.toSet()

    private fun grantedTypes(
      types: Array<SamsungHealthDataType>,
      granted: Set<Permission>
    ): Array<SamsungHealthDataType> =
      types.filter { granted.contains(Permission.of(dataTypeOf(it), AccessType.READ)) }.toTypedArray()

    private fun readBuilder(type: SamsungHealthPointType) = when (type) {
      SamsungHealthPointType.EXERCISE -> DataTypes.EXERCISE.readDataRequestBuilder
      SamsungHealthPointType.HEARTRATE -> DataTypes.HEART_RATE.readDataRequestBuilder
      SamsungHealthPointType.SLEEP -> DataTypes.SLEEP.readDataRequestBuilder
      SamsungHealthPointType.BODYCOMPOSITION -> DataTypes.BODY_COMPOSITION.readDataRequestBuilder
      SamsungHealthPointType.BLOODOXYGEN -> DataTypes.BLOOD_OXYGEN.readDataRequestBuilder
    }

    private fun changesBuilder(type: SamsungHealthPointType) = when (type) {
      SamsungHealthPointType.EXERCISE -> DataTypes.EXERCISE.changedDataRequestBuilder
      SamsungHealthPointType.HEARTRATE -> DataTypes.HEART_RATE.changedDataRequestBuilder
      SamsungHealthPointType.SLEEP -> DataTypes.SLEEP.changedDataRequestBuilder
      SamsungHealthPointType.BODYCOMPOSITION -> DataTypes.BODY_COMPOSITION.changedDataRequestBuilder
      SamsungHealthPointType.BLOODOXYGEN -> DataTypes.BLOOD_OXYGEN.changedDataRequestBuilder
    }

    private fun statusOf(e: HealthDataException): SamsungHealthStatus? = when (e.errorCode) {
      ErrorCode.ERR_PLATFORM_NOT_INSTALLED -> SamsungHealthStatus.NOTINSTALLED
      ErrorCode.ERR_OLD_VERSION_PLATFORM -> SamsungHealthStatus.UPDATEREQUIRED
      ErrorCode.ERR_PLATFORM_DISABLED -> SamsungHealthStatus.DISABLED
      ErrorCode.ERR_PLATFORM_NOT_INITIALIZED -> SamsungHealthStatus.NOTINITIALIZED
      ErrorCode.ERR_ACCESS_CONTROL, ErrorCode.ERR_INVALID_PLATFORM_SIGNATURE -> SamsungHealthStatus.APPNOTALLOWED
      else -> null
    }

    // JS parses the "[code]" prefix into SamsungHealthError.code
    private fun sdkError(e: HealthDataException): Exception =
      Exception("[${e.errorCode ?: "unknown"}] ${e.errorMessage}", e)
  }
}
