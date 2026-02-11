# DevConverter

<p align="center">
  <img src="public/favicon.png" alt="DevConverter Logo" width="100" />
</p>

DevConverter is a comprehensive suite of free, client-side developer tools designed to make your daily tasks easier. Convert, format, and visualize data instantly in your browser without sending data to a server.

## Features

- **Encoders & Decoders**: Base64 to Image, Image to Base64, URL Encode/Decode.
- **JSON Tools**: Format JSON, Minify JSON, JSON to TypeScript interfaces.
- **SQL Tools**: SQL Formatter, SQL to CSV/JSON.
- **Curl Tools**: Convert Curl commands to Fetch, Python, Go, etc.
- **Date Tools**: Timestamp converter, Date formatting.
- **Utility**: UUID Generator, Hash Generator, and more.

## Tech Stack

- **Framework**: [Angular](https://angular.io/) (v19+)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Build Tool**: Angular CLI
- **State Management**: RxJS
- **Formatting Libraries**: `sql-formatter`, `prettier`, `js-beautify`

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/dev-converter.git
   cd dev-converter/fe-converter
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   ng serve
   ```

4. Open your browser and navigate to `http://localhost:4200/`.

## Building

To build the project for production:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Contributing

Capabilities are always growing! If you'd like to contribute:

1. Fork the repo.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
