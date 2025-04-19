# Request Forwarder Frontend

A web frontend of the Request Forwarder.

## Overview

This application provides a user interface for interacting with the Request Forwarder API, which allows you to capture and inspect HTTP requests. The frontend is built with React, TypeScript, and modern web development practices.

## Features

- **Authentication**: Generate tokens with custom port, path, and security settings
- **Request Listing**: View all captured requests with key information
- **Request Details**: Inspect detailed information about each request:
  - Overview of request metadata
  - Headers inspection
  - Body content (with JSON formatting)
  - URL parameters
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Built with accessibility in mind (ARIA attributes, semantic HTML)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd request-forwarder-fe
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the API endpoint (optional):
   Create a `.env` file in the root directory with:
   ```
   REACT_APP_API_BASE_URL=http://your-api-url
   ```
   If not specified, it defaults to `http://localhost:8080`.

4. Start the development server:
   ```
   npm start
   ```

5. Build for production:
   ```
   npm run build
   ```

## Usage

1. **Generate a Token**:
   - Navigate to the Authentication page
   - Enter your API details (port, path, and whether to use HTTPS)
   - Click "Generate Token"

2. **View Requests**:
   - After generating a token, you'll be redirected to the Requests page
   - All captured requests will be displayed in a table
   - The list automatically refreshes every 5 seconds

3. **Inspect Request Details**:
   - Click "View Details" on any request to see more information
   - Use the tabs to switch between different views (Overview, Headers, Body, Params)

## Possible Future Enhancements

- Replay selected request
- User accounts and saved tokens
- Request filtering and search
- Custom request creation
- Export/import functionality

## Subscription Information

This service will require a paid subscription for production use in the future. The current version is available for development and testing purposes.

## License

[MIT License](LICENSE)
