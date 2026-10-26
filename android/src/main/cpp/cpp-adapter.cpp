#include <jni.h>
#include "obitrain_samsunghealthOnLoad.hpp"

#include <fbjni/fbjni.h>


JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, []() {
    margelo::nitro::obitrain_samsunghealth::registerAllNatives();
  });
}