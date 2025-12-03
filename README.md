# UNTITLED.STREAM Album Downloader

A Node.js tool to download albums from **UNTITLED.STREAM** and save tracks as MP3s with proper metadata (title, artist, album).

## Features

- Download every track from an album.
- Automatically embed metadata (track title, artist, album).

## Requirements

- **Node.js** v14 or higher
- Dependencies:
  - `cheerio` (scrape album data)
  - `node-id3` (write MP3 tags)
  - Built-in: `https`, `fs`, `readline`

## Installation

1. Clone or download this repo.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
