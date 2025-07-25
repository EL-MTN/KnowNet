# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnowNet is a TypeScript CLI application for personal knowledge management that tracks beliefs and theories with full derivation chains. It uses a layered architecture with clear separation between CLI, core domain logic, services, and AI integration.

## Development Commands

```bash
# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run compiled application (interactive mode)
npm start

# Command-line mode is available through npm run dev
# Example: npm run dev add axiom "My belief" --confidence 0.8 --tags philosophy

# Run tests (Jest framework configured but no tests implemented yet)
npm test

# Code quality checks - ALWAYS run these before completing tasks
npm run lint        # ESLint code style check
npm run typecheck   # TypeScript type verification without emit
```

## Architecture

The codebase follows a domain-driven design with these key layers:

1. **CLI Layer** (`src/cli/`) - Interactive menu-driven interface handling user interactions
2. **Core Domain** (`src/core/`) - Business logic for statements, derivations, and knowledge network
3. **Services** (`src/services/`) - Storage, querying, and contradiction detection
4. **AI Integration** (`src/ai/`) - Theory generation, duplicate detection, and knowledge insights via local LLM

Key architectural patterns:

- All statements (axioms and theories) extend the base Statement class
- DerivationEngine handles logic propagation and confidence calculations
- KnowledgeNetwork is the main aggregate managing all statements and their relationships
- Services are stateless and operate on the knowledge network

## Key Technical Details

- **TypeScript Configuration**: Strict mode enabled with comprehensive type checking
- **Data Persistence**: JSON file storage at `data/knowledge.json` with automatic backups
- **Statement Types**:
    - Axioms: Fundamental beliefs (no derivation)
    - Theories: Hypotheses derived from other statements
- **Confidence System**: Optional confidence levels (0-1) that propagate through derivation chains

## Working with the Codebase

When implementing new features:

1. Follow the existing architectural patterns - extend Statement for new statement types, add services for new capabilities
2. Use the existing type definitions in `src/core/types.ts`
3. Maintain the separation between layers - CLI should not directly access storage, services should be stateless
4. All public methods should have proper TypeScript types
5. Use UUID for all statement IDs via the `uuid` package

When modifying existing code:

1. Check for dependencies in the derivation system before changing statement relationships
2. Run contradiction detection after changes that affect logical relationships
3. Ensure data migration if changing the storage format
4. Update the QueryService if adding new searchable fields
