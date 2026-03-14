# Capacitor WebView 앱용 ProGuard 규칙

# Capacitor 브릿지 클래스 유지
-keep class com.getcapacitor.** { *; }
-keep class com.towerofcardborn.app.** { *; }

# AndroidX 호환성
-keep class androidx.** { *; }
-dontwarn androidx.**

# WebView JavaScript 인터페이스 유지
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 디버깅용 라인 넘버 유지
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
