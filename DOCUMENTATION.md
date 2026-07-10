# Airgapped QR Code Transfer

## Overview

Airgapped QR Code Transfer is a lightweight web application for moving files between devices without using the internet, Bluetooth, Wi-Fi, or any other network connection. It is designed for situations where two devices need to exchange data securely and offline, such as demonstrations, field work, or environments with restricted connectivity.

The app works entirely in the browser. A sender device prepares a file, converts it into smaller data chunks, and displays those chunks as QR codes. A receiver device scans the QR codes and rebuilds the original file.

## What the App Does

This application lets users:

- Select a file on one device and send it to another device.
- Encode file data into QR codes for display and scanning.
- Reassemble the scanned data into the original file on the receiving device.
- Transfer data without relying on a shared network connection.

## Main Features

- Air-gapped file transfer: works without internet or local network access.
- Browser-based workflow: no installation is required beyond opening the app in a browser.
- QR code generation and scanning: uses QR codes as the transport medium for file chunks.
- File chunking: breaks larger files into manageable pieces for transfer.
- Compression support: reduces the amount of data that must be encoded into the QR codes.
- Cross-device transfer: a sender and receiver can use separate devices with cameras and screens.
- Recovery workflow for missed frames: the receiver can pause and review missing chunk indexes, and the sender can replay only those requested frames.
- Input validation for recovery requests: the sender validates chunk ranges and indexes before replaying them.
- Simple user experience: a straightforward process for sending, recovering, and downloading files.

## Typical Usage Flow

1. The sender opens the generator interface and selects a file.
2. The app compresses and splits the file into QR-code-friendly chunks.
3. Each chunk is displayed as a QR code on the sender screen.
4. The receiver opens the scanner interface and scans the QR codes with a camera.
5. If some frames are missed, the receiver can pause and review the missing chunk indexes.
6. The sender can then replay only the missing chunk indexes or ranges provided by the receiver.
7. The receiver rebuilds the file and downloads it when the full transfer is complete.

### Transfer Flow Diagram

```text
Sender Device                Receiver Device
+----------------+           +-------------------+
| Select file   |           | Start receiver    |
| Compress data | --------> | Scan QR frames    |
| Split chunks  |           | Reassemble chunks |
| Show QR codes |           | Save file         |
+----------------+           +-------------------+
        \                          /
         \                        /
          \---- Missing frames ----/
                   (pause and replay)
```

## When to Use It

This tool is useful when:

- You need to transfer files between devices that are not connected to the same network.
- A quick offline transfer method is needed.
- You want a simple, no-install solution that works in a modern web browser.

## Streaming a Folder

This app can also be used to transfer an entire folder by packaging it into a zip archive first, converting that archive into a base64 text file, and then sending the base64 file through the QR transfer flow.

### Sender (typically a Windows PC)

1. Put the folder you want to transfer into a zip archive, for example: MyFolder.zip.
2. Convert the zip file to a base64 text file with a single PowerShell command:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('MyFolder.zip')) | Set-Content -Path 'MyFolder.txt'
```

3. Open the generator interface and select the generated MyFolder.txt file.
4. Start the transfer. The app will encode the base64 file into QR frames for the receiver.

### Receiver (for example, an Android phone)

1. Open the scanner interface and start scanning.
2. Wait for the file to be downloaded to the receiver device.
3. Install the Termux application.
4. Grant Termux access to shared storage by running:

```bash
termux-setup-storage
```

This opens a system permission prompt. Once access is granted, Termux creates a `~/storage` directory with shortcuts to standard Android folders such as Downloads, DCIM, Music, and Pictures.

5. Navigate to the Downloads folder:

```bash
cd ~/storage/downloads
```

6. Decode the base64 file back into the zip archive:

```bash
base64 -d -i MyFolder.txt > MyFolder.zip
```

7. Look for MyFolder.zip in the Downloads folder and use any archive extractor app to extract its contents.

### Notes

This workflow is especially useful when you want to transfer a folder without relying on network connectivity. The zip step reduces the amount of data and makes the transfer more practical for QR-based transport.
