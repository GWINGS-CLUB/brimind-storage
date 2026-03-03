#!/bin/bash
# install.sh - Linux installer for Vibe Brimind

INSTALL_DIR="$HOME/VibeBrimind"
FLAG_FILE="$INSTALL_DIR/.installed"
ZIP_URL="https://brimind.pro/storage/Vibe-Brimind-linux.zip"
ZIP_FILE="/tmp/Vibe-Brimind-linux.zip"
EXE_PATH="$INSTALL_DIR/Vibe-Brimind"

echo ""
echo " ============================================"
echo "  Vibe Brimind - Installer / Launcher"
echo " ============================================"
echo ""

# --- Already installed? Just run ---
if [ -f "$FLAG_FILE" ] && [ -f "$EXE_PATH" ]; then
  echo " Already installed. Launching..."
  "$EXE_PATH" &
  exit 0
fi

echo " First time setup - this may take a minute..."
echo ""

# --- Check curl or wget ---
if command -v curl &>/dev/null; then
  DOWNLOADER="curl"
elif command -v wget &>/dev/null; then
  DOWNLOADER="wget"
else
  echo " ERROR: Neither curl nor wget found. Please install one."
  exit 1
fi

# --- Create install dir ---
mkdir -p "$INSTALL_DIR"

# --- Download ---
echo " [1/3] Downloading Vibe Brimind for Linux..."
if [ "$DOWNLOADER" = "curl" ]; then
  curl -L --progress-bar "$ZIP_URL" -o "$ZIP_FILE"
else
  wget -q --show-progress "$ZIP_URL" -O "$ZIP_FILE"
fi

if [ $? -ne 0 ]; then
  echo " ERROR: Download failed. Check your internet connection."
  exit 1
fi
echo " Download complete."
echo ""

# --- Extract ---
echo " [2/3] Extracting..."
unzip -o "$ZIP_FILE" -d "$INSTALL_DIR"
if [ $? -ne 0 ]; then
  echo " ERROR: Extraction failed. Make sure unzip is installed."
  exit 1
fi
rm -f "$ZIP_FILE"

# --- Make executable ---
find "$INSTALL_DIR" -name "Vibe-Brimind*" -type f | while read f; do
  chmod +x "$f"
done

# --- Write flag ---
touch "$FLAG_FILE"

# --- Launch ---
echo " [3/3] Launching Vibe Brimind..."
if [ -f "$EXE_PATH" ]; then
  "$EXE_PATH" &
else
  FOUND=$(find "$INSTALL_DIR" -name "Vibe-Brimind*" -type f | head -1)
  if [ -n "$FOUND" ]; then
    chmod +x "$FOUND"
    "$FOUND" &
  else
    echo " ERROR: Executable not found after extraction."
    exit 1
  fi
fi

echo ""
echo " Done! Vibe Brimind is running."
sleep 2
