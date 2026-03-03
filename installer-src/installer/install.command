#!/bin/bash
# install.command - macOS double-click installer for Vibe Brimind

# Remove macOS quarantine flag on self (fixes Gatekeeper block)
xattr -d com.apple.quarantine "$0" 2>/dev/null || true

INSTALL_DIR="$HOME/VibeBrimind"
FLAG_FILE="$INSTALL_DIR/.installed"
ARCH=$(uname -m)

# Pick correct zip for mac architecture
if [ "$ARCH" = "arm64" ]; then
  ZIP_URL="https://brimind.pro/storage/Vibe-Brimind-mac.zip"
  EXE_NAME="Vibe-Brimind"
else
  ZIP_URL="https://brimind.pro/storage/Vibe-Brimind-mac-x64.zip"
  EXE_NAME="Vibe-Brimind"
fi

ZIP_FILE="/tmp/Vibe-Brimind-mac.zip"
EXE_PATH="$INSTALL_DIR/$EXE_NAME"

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

# --- Create install dir ---
mkdir -p "$INSTALL_DIR"

# --- Download ---
echo " [1/3] Downloading Vibe Brimind for Mac ($ARCH)..."
curl -L --progress-bar "$ZIP_URL" -o "$ZIP_FILE"
if [ $? -ne 0 ]; then
  echo " ERROR: Download failed. Check your internet connection."
  read -p " Press Enter to close..."
  exit 1
fi
echo " Download complete."
echo ""

# --- Extract ---
echo " [2/3] Extracting..."
unzip -o "$ZIP_FILE" -d "$INSTALL_DIR"
if [ $? -ne 0 ]; then
  echo " ERROR: Extraction failed."
  read -p " Press Enter to close..."
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
    read -p " Press Enter to close..."
    exit 1
  fi
fi

echo ""
echo " Done! Vibe Brimind is running."
sleep 3
