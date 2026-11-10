# Proguard rules
-keepattributes *Annotation*
-keepclassmembers class * {
    @org.chromium.base.annotations.CalledByNative <methods>;
}
