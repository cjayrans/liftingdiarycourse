# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application using the App Router, TypeScript, React 19, and Tailwind CSS v4. The project appears to be a lifting diary/course application (based on the repository name).

## IMPORTANT: Documentation Reference Policy

**ALWAYS refer to the `/docs` directory when generating code.**

When creating, modifying, or working with any code in this repository, you MUST:
- Check for relevant documentation files in the `/docs` directory. Reference and follow patterns, guidelines, and examples from the applicable docs. Ensure consistency with documented standards and practices:
  - /docs/auth.md
  - /docs/data-fetching.md
  - /docs/data-mutations.md
  - /docs/routing.md
  - /docs/ui.md
- If no relevant documentation exists, generate code following best practices for the framework/library being used

The `/docs` directory contains authoritative guidance for this project. Adherence to these documents is mandatory for all code generation.

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
