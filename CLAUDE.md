# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application using the App Router, TypeScript, React 19, and Tailwind CSS v4. The project appears to be a lifting diary/course application (based on the repository name).

## Development Commands

**Start development server:**
```bash
npm run dev
```
Server runs on http://localhost:3000 with hot reload enabled.

**Build for production:**
```bash
npm build
```

**Start production server:**
```bash
npm start
```

**Lint code:**
```bash
npm run lint
```

## Architecture

### Framework & Routing
- **Next.js 16** with App Router architecture
- Pages are in `app/` directory using file-system based routing
- Server Components by default (use `"use client"` directive when needed)

### Styling
- **Tailwind CSS v4** with PostCSS
- Global styles in `app/globals.css` using CSS variables for theming
- Dark mode supported via `prefers-color-scheme` media query
- Custom color tokens: `--background`, `--foreground`
- Geist Sans and Geist Mono fonts loaded via `next/font/google`

### TypeScript Configuration
- **Strict mode enabled**
- Path alias `@/*` maps to root directory
- Target: ES2017
- JSX: react-jsx (automatic runtime)

### Project Structure
```
app/
  layout.tsx      # Root layout with font loading and metadata
  page.tsx        # Home page
  globals.css     # Global styles and Tailwind imports
```

## Key Configuration Details

**TypeScript paths:** Use `@/` prefix to import from root (e.g., `import Component from '@/app/components/Component'`)

**Tailwind CSS v4:** Uses new `@import "tailwindcss"` syntax in `app/globals.css` with `@theme inline` blocks for custom properties

**ESLint:** Configured with Next.js recommended rules for both core web vitals and TypeScript

## Development Notes

- The app uses Next.js Image component for optimized images (see `app/page.tsx`)
- Root layout applies font CSS variables to body element
- Static assets should be placed in `public/` directory
