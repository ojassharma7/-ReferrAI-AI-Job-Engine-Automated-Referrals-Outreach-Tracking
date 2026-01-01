# Contributing to ReferrAI

Thank you for your interest in contributing to ReferrAI! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Project Structure](#project-structure)
- [Submitting Changes](#submitting-changes)

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/-ReferrAI-AI-Job-Engine-Automated-Referrals-Outreach-Tracking.git
   cd -ReferrAI-AI-Job-Engine-Automated-Referrals-Outreach-Tracking
   ```

3. **Set up environment:**
   ```bash
   # Main project
   cp .env.example .env
   
   # Website
   cd website
   cp .env.example .env.local
   ```

4. **Install dependencies:**
   ```bash
   # Main project
   npm install
   
   # Website
   cd website
   npm install
   ```

## 💻 Development Setup

### Main Pipeline Development

```bash
# Run in watch mode
npm run dev <jobId>

# Run full pipeline
npm run pipeline <jobId>

# Test Google Sheets integration
npm run test:sheets
```

### Website Development

```bash
cd website

# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## 📝 Code Style

### TypeScript

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Use meaningful variable and function names
- Add JSDoc comments for public functions

### File Organization

- Keep related code together
- Follow the existing directory structure
- Put new utilities in appropriate `lib/` or `src/` directories

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages
- Use try-catch blocks for async operations
- Log errors appropriately

## 🗂️ Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed organization.

**Key directories:**
- `src/` - Main pipeline source code
- `website/` - Next.js web application
- `docs/` - Documentation
- `scripts/` - Utility scripts
- `n8n/` - n8n workflow definitions

## 🔄 Submitting Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write clear, focused commits
   - Follow existing code style
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes:**
   - Test the main pipeline if you modified it
   - Test the website if you modified it
   - Ensure no breaking changes

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request:**
   - Provide a clear description
   - Reference any related issues
   - Include screenshots if UI changes

## 📚 Documentation

- Update relevant documentation when adding features
- Keep `README.md` up to date
- Add examples for new features
- Update `PROJECT_STRUCTURE.md` if structure changes

## 🐛 Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Relevant error messages or logs

## ✅ Checklist

Before submitting:
- [ ] Code follows existing style
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Environment variables documented
- [ ] Changes tested locally

Thank you for contributing! 🎉




