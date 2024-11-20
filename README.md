# DotCMS Language Services

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/1005263?s=280&v=4" alt="DotCMS Logo" width="150"/>
</p>

## Overview

DotCMS Language Services is a VS Code extension that enhances the development experience when working with DotCMS translations in HTML files. It provides real-time visual feedback for translation keys used with the `dm` pipe.

## Features

- 🔍 Real-time validation of translation keys
- ❌ Visual indicators (red underline) for missing translations
- 🔄 Automatic reload when translation files change
- 💡 Hover support showing translation values
- 🛠️ Configurable translation file path

## Pre-Instalation
1. Go to `.vscode` folder
2. Create a file called `settings.json``
3. Paste this as content
```json
{
  "dotcmsTranslations.propertiesPath": "dotCMS/src/main/webapp/WEB-INF/messages/Language.properties"
}
```

## Installation

1. Navigate to the root directory of this project and run `npx vsce package` to generate the `.vsix` file.
2. Open Visual Studio Code.
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) to open the command palette.
4. Type "Install from VSIX" and select the corresponding option.
5. Locate and select the generated `.vsix` file to install the extension.

## Configuration

Add the following to your VS Code settings: 