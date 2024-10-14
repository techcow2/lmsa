# LMSA - LM Studio Android Front-End

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)


<div style="display: flex; justify-content: space-between; gap: 10px;">
    <img src="https://github.com/user-attachments/assets/b3640a20-a180-4a37-94ae-53c6020ca03b" alt="Google Pixel 4 XL Screenshot 0" style="width: 22%; height: auto;">
    <img src="https://github.com/user-attachments/assets/dd665c56-4639-440d-8826-eb0813117304" alt="Google Pixel 4 XL Screenshot 2" style="width: 22%; height: auto;">
    <img src="https://github.com/user-attachments/assets/23b6236b-980e-443c-afc9-b974029bcc8a" alt="Google Pixel 4 XL Screenshot 3" style="width: 22%; height: auto;">
    <img src="https://github.com/user-attachments/assets/85e275f3-62fa-4143-9fa2-1cade83031c5" alt="Google Pixel 4 XL Screenshot 1" style="width: 22%; height: auto;">
</div>

## Overview

LMSA (LM Studio Assistant) is an open-source Android front-end application for LM Studio. It provides a clean, user-friendly interface to interact with language models on your Android device. LMSA is designed with privacy in mind, offering a tracking-free and ad-free experience for users who want to leverage the power of large language models on their mobile devices.

## Features

### 🔒 Privacy-Focused

- **No Tracking**: Your data and interactions remain private.
- **Ad-Free**: Enjoy a clean, distraction-free experience.

### 💬 Customizable Interactions

- **System Prompt**: Set and modify the system prompt to guide your AI interactions.
- **Adjustable Temperature**: Fine-tune the LLM's creativity directly from your device.

### 📱 User-Friendly Interface

- **Clean Design**: Intuitive and minimalistic UI for effortless navigation.
- **Model Display**: Easily view the currently loaded language model on your device.

### 🛠 Technical Highlights

- **Open Source**: Transparent codebase, open for community contributions and audits.
- **LM Studio Integration**: Seamless connection with LM Studio's powerful language model capabilities.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/techcow2/lmsa.git
1. Open the project in Android Studio.
2. Build and run the app on your Android device or emulator.

Alternatively, download the latest APK from the [Releases](https://github.com/yourusername/LMSA/releases) page.

## Usage

1. **Run LM Studio**: Start LM Studio on your computer.
2. **Enable Server**: Run the server within LM Studio.
3. **Load Model**: Load the model of your choice in LM Studio.
4. **Network Configuration**:
   - Ensure CORS and network sharing are enabled in LM Studio settings.
5. **Copy IP Address**: Find and copy the IP address of your computer.
6. **Connect LMSA to LM Studio**:
   - Launch the LMSA app on your Android device.
   - Navigate to the Settings menu in LMSA.
   - Enter the copied IP address in the designated field.
   - Tap 'Close' to save the settings.
7. **Interact with the Model**: Start interacting with the AI model through LMSA's clean interface.

## Configuration

### Setting the System Prompt

1. Navigate to the Settings menu.
2. Find the "System Prompt" section.
3. Enter your desired system prompt to guide the AI's behavior.

### Adjusting LLM Temperature

1. During a conversation, locate the temperature slider.
2. Adjust the slider to increase (more creative) or decrease (more focused) the temperature.

### Viewing Loaded Model

The currently loaded model will be displayed at the top of the main interface.

## Contributing

We welcome contributions to LMSA! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with clear, descriptive messages.
4. Push your changes to your fork.
5. Submit a pull request to the main repository.

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## Disclaimer

LMSA is a third-party application and is not affiliated with LM Studio or its developers. This app is independently developed to provide an Android front-end interface for interacting with LM Studio. Use of this app is at your own discretion, and the developers of LMSA are not responsible for any issues arising from its use.

## License

LMSA is released under the [MIT License](LICENSE.md). Feel free to use, modify, and distribute the code as per the license terms.
