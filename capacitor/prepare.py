#!/usr/bin/env python3
"""Dipakai workflow: `prepare.py web` menyalin file web ke www/, `prepare.py native` mengatur izin & ikon proyek Android."""
import os, shutil, sys, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)

def web():
    out = os.path.join(HERE, "www")
    shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    for f in ["index.html", "sw.js", "manifest.json"]:
        shutil.copy(os.path.join(ROOT, f), out)
    for d in ["css", "js", "icons", "img"]:
        shutil.copytree(os.path.join(ROOT, d), os.path.join(out, d))
    print("web disalin:", sorted(os.listdir(out)))

def native():
    res = os.path.join(HERE, "android/app/src/main/res")
    man = os.path.join(HERE, "android/app/src/main/AndroidManifest.xml")
    s = open(man).read()
    perms = ["android.permission.CAMERA", "android.permission.ACCESS_FINE_LOCATION",
             "android.permission.ACCESS_COARSE_LOCATION", "android.permission.POST_NOTIFICATIONS",
             "android.permission.VIBRATE"]
    add = "".join(f'    <uses-permission android:name="{p}" />\n' for p in perms if p not in s)
    add += '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n'
    add += '    <uses-feature android:name="android.hardware.camera.front" android:required="false" />\n'
    add += '    <uses-feature android:name="android.hardware.location.gps" android:required="false" />\n'
    s = s.replace("</manifest>", add + "</manifest>")
    open(man, "w").write(s)
    # ikon adaptif beresolusi tinggi (override resource bawaan Capacitor)
    shutil.copytree(os.path.join(HERE, "res"), res, dirs_exist_ok=True)
    print("izin & ikon diatur")

{"web": web, "native": native}[sys.argv[1]]()
