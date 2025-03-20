# UNTITLED.STREAM Album Downloader

This Node.js application provides an efficient way to download tracks from an UNTITLED.STREAM album, save them locally as MP3 files, and automatically embed metadata such as title, artist, and album information into each file. This tool simplifies the process of organizing music from UNTITLED.STREAM for personal use or archival purposes.

## Features

- **Album Track Downloading**: Downloads all tracks from a specified UNTITLED.STREAM album.
- **Metadata Embedding**: Automatically adds essential metadata (track title, artist name, and album name) to each downloaded MP3 file.
- **Error Handling**: Includes robust error handling for file downloads and metadata embedding.
- **User-Friendly Interface**: The application prompts for user input to easily obtain album URL and download location.

## Requirements

- **Node.js**: Version 14.x or higher is required to run the script.
- **npm dependencies**:
  - `cheerio`: For scraping the album data from the UNTITLED.STREAM page.
  - `node-id3`: For editing MP3 metadata.
  - Built-in modules: `https`, `fs`, and `readline` are used for downloading files and interacting with the user.

## Installation

To set up the project, follow these steps:

1. Clone or download the repository.
2. Open your terminal and navigate to the project directory.
3. Run the following command to install the required dependencies:

   ```bash
   npm install
   ```
   
## Technical Overview
The script performs the following steps:

Data Scraping: Scrapes the UNTITLED.STREAM page to gather album and track data using cheerio.
Download URL Generation: Generates signed download URLs for each track via a POST request to the UNTITLED.STREAM API.
Track Downloading: Downloads the tracks as MP3 files and saves them to the user-defined path.
Metadata Embedding: Adds track-specific metadata to each MP3 file to ensure proper organization in music libraries.

# License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---
