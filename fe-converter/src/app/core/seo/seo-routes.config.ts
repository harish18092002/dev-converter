import type { SeoMeta } from '../services/seo.service';
import { SITE_URL } from '../services/seo.service';

function tool(
  name: string,
  desc: string,
  path: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description: desc,
    url: `${SITE_URL}${path}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    creator: { '@type': 'Organization', name: 'DevConverter', url: SITE_URL },
  };
}

export const SEO_ROUTES: Record<string, SeoMeta> = {
  '/': {
    title: 'Free Developer Tools — JSON, Base64, JWT, CSS & More',
    description:
      'DevConverter: 40+ free online developer tools that run entirely in your browser. JSON converter, Base64 encoder, JWT decoder, color picker, CSS unit converter, password generator, UUID generator, and more. No sign-up, no data sent to servers.',
    keywords:
      'developer tools, json converter, base64 encoder, jwt decoder, color converter, css units, url encoder, password generator, uuid generator, online tools, free developer utilities, devconverter',
    path: '/',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'DevConverter',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description:
        '40+ free online developer tools: JSON, Base64, JWT, Color, CSS Units, Password, UUID, URL parser, HTTP codes, SQLite viewer, Regex, DateTime, cURL, Case converter.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'JSON to XML, YAML, CSV, SQL, TOML converter',
        'Base64 encoder and decoder for strings, images, PDFs',
        'JWT token decoder and inspector',
        'Color format converter (HEX, RGB, HSL, OKLCH)',
        'CSS unit converter (px, rem, em, vw, vh)',
        'Cryptographic password generator',
        'UUID v4/v7 and ULID generator',
        'URL parser and percent-encoder',
        'HTTP status codes reference',
        'SQLite database viewer',
        'Real-time regex tester',
        'Unix timestamp and DateTime tools',
        'cURL to Fetch/Axios/Python converter',
        'Text case converter',
      ],
    },
  },
  '/json': {
    title: 'JSON Converter — JSON to XML, YAML, CSV, SQL, TOML Online',
    description:
      'Free online JSON converter. Convert JSON to XML, YAML, CSV, Excel, SQL, and TOML. Format, validate, and minify JSON instantly. Bidirectional conversion. All processing happens in your browser — no data sent to servers.',
    keywords:
      'json converter, json to xml, json to yaml, json to csv, json to sql, json formatter, json validator, json minifier, json to toml, online json tool',
    path: '/json',
    schema: tool(
      'JSON Converter',
      'Convert JSON to XML, YAML, CSV, SQL, and TOML. Format and validate JSON online.',
      '/json',
    ),
  },
  '/base64': {
    title: 'Base64 Encoder & Decoder — Strings, Images, PDF, Files',
    description:
      'Free Base64 encoder and decoder. Encode and decode strings, images, PDFs, and binary files to Base64. URL-safe encoding supported. Fast, private, runs entirely in your browser.',
    keywords:
      'base64 encoder, base64 decoder, base64 to image, image to base64, encode base64 online, decode base64 online, url-safe base64, base64 pdf, base64 file',
    path: '/base64',
    schema: tool(
      'Base64 Encoder & Decoder',
      'Encode and decode Base64 for strings, images, PDFs, and binary files.',
      '/base64',
    ),
  },
  '/jwt': {
    title: 'JWT Decoder — Decode & Inspect JSON Web Tokens Online',
    description:
      'Free JWT decoder. Decode JSON Web Tokens, inspect header and payload claims, check expiry, and explore OAuth/OIDC tokens — fully client-side, no server involved.',
    keywords:
      'jwt decoder, decode jwt token, json web token, jwt claims, jwt expiry, jwt inspector, oauth token decoder, jwt online, jwt parser free',
    path: '/jwt',
    schema: tool(
      'JWT Decoder',
      'Decode JWT tokens, inspect header/payload claims, and check expiry online.',
      '/jwt',
    ),
  },
  '/regex': {
    title: 'Regex Tester Online — JavaScript Regular Expression Debugger',
    description:
      'Real-time JavaScript regex tester with live match highlighting, group capture, named groups, and multi-flag support. Test and debug regular expressions instantly in your browser.',
    keywords:
      'regex tester, regular expression tester, online regex, javascript regex, regex debugger, regex highlighter, regex groups, regex flags, test regex online',
    path: '/regex',
    schema: tool(
      'Regex Tester',
      'Test JavaScript regular expressions with live match highlighting and group capture.',
      '/regex',
    ),
  },
  '/color': {
    title: 'Color Converter — HEX, RGB, HSL, OKLCH Color Format Tool',
    description:
      'Free online color converter. Convert between HEX, RGB, HSL, OKLCH, and CSS color formats instantly. Live color preview and palette generation. Perfect for web developers and designers.',
    keywords:
      'color converter, hex to rgb, rgb to hex, hsl converter, oklch converter, css color tool, color format converter, web color picker, hex color code',
    path: '/color',
    schema: tool(
      'Color Converter',
      'Convert HEX, RGB, HSL, and OKLCH color formats with live preview online.',
      '/color',
    ),
  },
  '/url': {
    title: 'URL Parser & Encoder — Decode, Encode, Build Query Strings',
    description:
      'Free URL parser and encoder. Parse any URL into components (protocol, hostname, path, query), percent-encode/decode strings, and build query strings visually. All in your browser.',
    keywords:
      'url parser, url encoder, url decoder, url components, query string builder, percent encoding, url encode online, url decode online, uri encoder',
    path: '/url',
    schema: tool(
      'URL Parser & Encoder',
      'Parse URL components, encode/decode strings, and build query strings.',
      '/url',
    ),
  },
  '/password': {
    title: 'Password Generator — Secure, Cryptographic & Random Passwords',
    description:
      'Generate cryptographically secure passwords and passphrases using the Web Crypto API. Customize length, character sets, symbols, and entropy. Zero data sent to any server.',
    keywords:
      'password generator, secure password generator, random password, strong password generator, passphrase generator, cryptographic password, web crypto, free password tool',
    path: '/password',
    schema: tool(
      'Password Generator',
      'Generate cryptographically secure passwords and passphrases using Web Crypto API.',
      '/password',
    ),
  },
  '/generate': {
    title: 'UUID & ULID Generator — UUID v4, v7 Free Online Tool',
    description:
      'Generate UUID v4, UUID v7, and ULID identifiers in bulk using the Web Crypto API. Copy, export, and use unique IDs in your applications. Free, fast, and instant.',
    keywords:
      'uuid generator, uuid v4 generator, uuid v7 generator, ulid generator, unique id generator, generate uuid online, bulk uuid, random id, guid generator',
    path: '/generate',
    schema: tool(
      'UUID & ULID Generator',
      'Generate UUID v4, v7, and ULID identifiers in bulk using Web Crypto API.',
      '/generate',
    ),
  },
  '/number': {
    title: 'Number Base Converter — Binary, Hex, Decimal, Octal Online',
    description:
      'Free online number base converter. Convert between decimal, hexadecimal (hex), binary, and octal number systems. Supports BigInt for very large numbers. Real-time conversion.',
    keywords:
      'number base converter, decimal to binary, binary to hex, hexadecimal converter, octal converter, decimal to hex, binary converter online, number system converter, bigint',
    path: '/number',
    schema: tool(
      'Number Base Converter',
      'Convert between decimal, hexadecimal, binary, and octal number systems.',
      '/number',
    ),
  },
  '/css-units': {
    title: 'CSS Unit Converter — px, rem, em, vw, vh, pt, cm Online',
    description:
      'Free CSS unit converter. Convert between px, rem, em, vw, vh, pt, cm, mm, and more CSS measurement units in real time. Configure root font size and viewport dimensions.',
    keywords:
      'css unit converter, px to rem, rem to px, em converter, vw vh converter, css units online, responsive design converter, css measurement tool, pixels to rem',
    path: '/css-units',
    schema: tool(
      'CSS Unit Converter',
      'Convert px, rem, em, vw, vh, and all CSS measurement units in real time.',
      '/css-units',
    ),
  },
  '/http-status': {
    title: 'HTTP Status Codes Reference — Complete 1xx to 5xx Guide',
    description:
      'Complete searchable HTTP status codes reference. All 1xx, 2xx, 3xx, 4xx, and 5xx codes with descriptions, RFC 9110 compliance notes, and usage examples. Bookmark for quick lookup.',
    keywords:
      'http status codes, 404 not found, 500 internal server error, http error codes, rest api status codes, 301 redirect, 200 ok, 403 forbidden, 401 unauthorized, rfc 9110 http codes list',
    path: '/http-status',
    schema: tool(
      'HTTP Status Codes Reference',
      'Complete searchable guide to all HTTP status codes — 1xx to 5xx, RFC 9110.',
      '/http-status',
    ),
  },
  '/date': {
    title: 'DateTime Tools — Unix Timestamp, ISO 8601, UTC Converter',
    description:
      'Free online datetime tools. Convert Unix timestamps to readable dates, format ISO 8601, convert UTC/local timezones, and calculate time differences. Runs in your browser.',
    keywords:
      'unix timestamp converter, datetime converter, iso 8601 converter, utc converter, epoch time converter, timestamp to date, date to unix timestamp, timezone converter online',
    path: '/date',
    schema: tool(
      'DateTime Tools',
      'Convert Unix timestamps, ISO 8601 dates, and timezone formats online.',
      '/date',
    ),
  },
  '/curl': {
    title: 'cURL Converter — cURL to Fetch, Axios, Python, Postman',
    description:
      'Convert cURL commands to JavaScript Fetch API, Axios, Python requests, or Postman collection JSON. Instantly translate any cURL command into your preferred HTTP client code.',
    keywords:
      'curl converter, curl to fetch, curl to axios, curl to python requests, curl to postman, http client converter, convert curl command online, rest api tool, curl parser',
    path: '/curl',
    schema: tool(
      'cURL Converter',
      'Convert cURL commands to Fetch, Axios, Python requests, or Postman collections.',
      '/curl',
    ),
  },
  '/utils': {
    title: 'Case Converter — camelCase, snake_case, kebab-case, PascalCase',
    description:
      'Free online text case converter. Transform text between camelCase, snake_case, kebab-case, PascalCase, CONSTANT_CASE, Title Case, and more. Instant string transformation for developers.',
    keywords:
      'case converter, camelcase converter, snake case converter, kebab case, pascal case, title case, constant case, text case transformer, string case tool, camel to snake',
    path: '/utils',
    schema: tool(
      'Case Converter',
      'Convert text between camelCase, snake_case, kebab-case, PascalCase, and more.',
      '/utils',
    ),
  },
  '/db': {
    title: 'SQLite Viewer Online — Browse SQLite Database Files Free',
    description:
      'Free online SQLite viewer. Upload and browse .db SQLite files directly in your browser. View table schemas, run queries, and export data to JSON or CSV. No file leaves your device.',
    keywords:
      'sqlite viewer online, sqlite database browser, browse sqlite online, db file viewer, sqlite to json, sqlite to csv, sql browser online, sqlite web viewer, open sqlite file online',
    path: '/db',
    schema: tool(
      'SQLite Viewer',
      'Upload and browse SQLite .db files online. Export tables to JSON or CSV.',
      '/db',
    ),
  },
};

/**
 * Returns the best SEO config for a given URL.
 * Handles: exact match → path without query → prefix match (e.g. /json/yaml → /json) → home fallback.
 */
export function getSeoForUrl(url: string): SeoMeta {
  if (SEO_ROUTES[url]) return SEO_ROUTES[url];
  const path = url.split('?')[0].split('#')[0];
  if (SEO_ROUTES[path]) return SEO_ROUTES[path];
  const prefix = '/' + path.split('/')[1];
  return SEO_ROUTES[prefix] ?? SEO_ROUTES['/'];
}
