# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` - Runs Vite dev server with hot reload
- **Build for production**: `npm run build` - Compiles TypeScript and builds with Vite
- **Preview production build**: `npm run preview` - Serves the built application locally
- **Type checking**: `npm run typecheck` - Run TypeScript compiler for type checking only
- **Linting**: `npm run lint` - Run ESLint on source files
- **Format code**: `npx prettier --write src/` - Format code with Prettier

## Project Architecture

This is a 2048 game implementation using:

- **Vite** as the build tool and dev server
- **TypeScript** with strict configuration for type safety
- **Vanilla JavaScript/TypeScript** (no framework) - direct DOM manipulation
- **ESNext modules** with bundler resolution

### Key Files
- `src/main.ts` - Entry point that renders into `#app` div
- `src/style.css` - Global styles
- `index.html` - HTML template with app container
- `tsconfig.json` - Strict TypeScript configuration with modern ES2022 target

### TypeScript Configuration
- Uses strict mode with all linting options enabled
- Module resolution set to "bundler" for Vite compatibility
- No emit mode (handled by Vite)
- Targets ES2022 with DOM types included

### Development Notes
- The project is currently minimal with just a "It works!" placeholder
- Game logic and UI components need to be implemented in TypeScript
- No testing framework is currently configured
- ESLint and Prettier are available but may need configuration files