#!/usr/bin/env python3
"""
Android build configuration setup script.
Run this to initialize Android build files after Capacitor sync.
"""

import os
import json
import sys

def create_android_files():
    """Create necessary Android configuration files."""
    
    android_dir = os.path.join(os.path.dirname(__file__), 'android')
    
    # Create gradle.properties
    gradle_props = """
org.gradle.jvmargs=-Xmx4096m
android.useAndroidX=true
android.enableJetifier=true
android.targetSdkVersion=33
android.compileSdkVersion=33
"""
    
    gradle_props_path = os.path.join(android_dir, 'gradle.properties')
    if not os.path.exists(gradle_props_path):
        os.makedirs(android_dir, exist_ok=True)
        with open(gradle_props_path, 'w') as f:
            f.write(gradle_props.strip())
        print(f"Created {gradle_props_path}")
    
    print("Android configuration ready!")

if __name__ == '__main__':
    create_android_files()
