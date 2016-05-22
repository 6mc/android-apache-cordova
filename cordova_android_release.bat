
REM Created by App Builder v2016.118
REM More information at https://www.davidesperalta.com/

@ECHO OFF
CLS

REM Set your provided Java home path variable
SET JAVA_HOME=C:\Program Files (x86)\Java\jdk1.7.0_55\
SET PATH=%PATH%;%JAVA_HOME%bin\

REM Set your provided Android home path variable
SET ANDROID_HOME=C:\Program Files (x86)\Android\android-sdk\
SET PATH=%PATH%;%ANDROID_HOME%platform-tools\

REM Add the Android platform for our app
CALL cordova platform add android

REM Add the Whitelist plugin for our app
CALL cordova plugin add cordova-plugin-whitelist

REM Build our app for the Android platform
CALL cordova build --release android

REM Pause the script execution, so we can view the script results
PAUSE
