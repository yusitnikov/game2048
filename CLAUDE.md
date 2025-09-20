# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` - Runs Vite dev server with hot reload (NEVER run this - user runs it themselves)
- **Build for production**: `npm run build` - Compiles TypeScript and builds with Vite
- **Preview production build**: `npm run preview` - Serves the built application locally
- **Type checking**: `npm run typecheck` - Run TypeScript compiler for type checking only
- **Linting**: `npm run lint` - Run ESLint on source files
- **Format code**: `npx prettier --write src/` - Format code with Prettier

## Project Architecture

This is a Tetris-style game with 2048 elements implementation using:

- **Vite** as the build tool and dev server
- **TypeScript** with strict configuration for type safety
- **Vanilla JavaScript/TypeScript** (no framework) - direct DOM manipulation
- **ESNext modules** with bundler resolution

### Key Files
- `src/main.ts` - Main game implementation with TetrisGame class
- `src/gameHelpers.ts` - Shared utility functions and constants
- `src/style.css` - Game styles and CSS variables
- `src/gallery.ts` - Additional gallery functionality
- `index.html` - HTML template with app container
- `tsconfig.json` - Strict TypeScript configuration with modern ES2022 target

### Game Architecture
- **TetrisGame class**: Main game controller handling state, DOM manipulation, and user interactions
- **Grid-based layout**: 6x7 grid with column-based piece dropping
- **Dynamic sizing**: Responsive grid that scales based on viewport size using CSS custom properties
- **Piece queue system**: Shows next 3 pieces to drop with visual preview
- **Powers of 2**: Game pieces are powers of 2 from 2^1 to 2^20 (1M)

### TypeScript Configuration
- Uses strict mode with all linting options enabled
- Module resolution set to "bundler" for Vite compatibility
- No emit mode (handled by Vite)
- Targets ES2022 with DOM types included

### ESLint Configuration
- Comprehensive setup with TypeScript, JSON, and CSS linting
- Uses modern ESLint flat config format
- Configured for browser globals and TypeScript recommended rules