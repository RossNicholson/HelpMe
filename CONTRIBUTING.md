# Contributing to HelpMe

Thank you for your interest in contributing to HelpMe! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/HelpMe.git
   cd HelpMe
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend
   cp frontend/env.example frontend/.env
   # Edit frontend/.env with your configuration
   ```

4. **Database Setup**
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

5. **Start Development Servers**
   ```bash
   # Backend (from backend directory)
   npm run dev
   
   # Frontend (from frontend directory)
   npm start
   ```

## 📝 Development Guidelines

### Code Style
- Use ESLint and Prettier for code formatting
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Git Workflow
1. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. Push and create a Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format
Use conventional commits format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

### Testing
- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Add integration tests for API endpoints

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, etc.)
- Screenshots if applicable

## 💡 Feature Requests

When suggesting features:
- Describe the use case
- Explain the expected benefit
- Provide examples if possible
- Consider implementation complexity

## 🔧 Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests** (if applicable)
5. **Update documentation** (if needed)
6. **Run linting and tests**
   ```bash
   npm run lint
   npm run test
   ```
7. **Submit a Pull Request**

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design tested
- [ ] Cross-browser compatibility checked

## 📚 Documentation

- Update README.md if adding new features
- Add API documentation for new endpoints
- Include code examples where helpful

## 🏷️ Versioning

We use [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality
- PATCH version for backwards-compatible bug fixes

## 📞 Getting Help

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and general discussion
- **Email**: helpme@rossnicholson.dev for urgent matters
- **Website**: [rossnicholson.dev](https://rossnicholson.dev)

## ☕ Supporting the Project

If you find HelpMe useful and would like to support its development:

### ☕ Buy Me a Coffee
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20Development-orange?style=for-the-badge&logo=buymeacoffee)](https://buymeacoffee.com/rossnicholson)

Show your appreciation with a coffee! Every contribution helps keep HelpMe free and open source.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to HelpMe! 🎉 