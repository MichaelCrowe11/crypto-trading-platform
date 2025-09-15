# Contributing to CryptoCrowe Trading Platform

Thank you for your interest in contributing to CryptoCrowe! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Issues
- Use the GitHub issue tracker to report bugs
- Provide detailed information about the issue
- Include steps to reproduce the problem
- Specify your environment (OS, Node.js version, etc.)

### Suggesting Features
- Open an issue with the "enhancement" label
- Clearly describe the proposed feature
- Explain why it would be beneficial
- Consider implementation complexity

### Code Contributions

#### 1. Fork and Clone
```bash
git clone https://github.com/your-username/crypto-trading-platform.git
cd crypto-trading-platform
npm install
```

#### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
```

#### 3. Development Guidelines

**Code Style:**
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

**Testing:**
- Write tests for new functionality
- Ensure existing tests still pass
- Test edge cases and error conditions

**Security:**
- Never commit API keys or sensitive data
- Use environment variables for configuration
- Follow security best practices
- Validate all user inputs

#### 4. Commit Guidelines
```bash
# Good commit messages
git commit -m "Add support for Kraken exchange integration"
git commit -m "Fix portfolio calculation bug for negative balances"
git commit -m "Improve error handling in trading engine"

# Use conventional commit format when possible
feat: add new trading strategy template
fix: resolve WebSocket connection timeout
docs: update API documentation
test: add unit tests for portfolio service
```

#### 5. Pull Request Process

1. **Update Documentation:**
   - Update README.md if needed
   - Add API documentation for new endpoints
   - Update environment variable examples

2. **Test Your Changes:**
   - Run all existing tests
   - Add new tests for your changes
   - Test manually in development environment

3. **Create Pull Request:**
   - Use a clear, descriptive title
   - Explain what changes were made and why
   - Reference any related issues
   - Include screenshots if UI changes were made

4. **PR Template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No sensitive data exposed
   ```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Redis server
- Supabase account
- Git

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Setup
1. Create Supabase project
2. Execute SQL schema from `database/schema.sql`
3. Update `.env` with Supabase credentials

## 📋 Development Guidelines

### Adding New Exchanges
1. Create exchange class in `src/exchanges/`
2. Implement required methods (fetchBalance, placeOrder, etc.)
3. Add to ExchangeManager supported exchanges
4. Update documentation
5. Add tests

### Creating New Strategies
1. Add strategy template to StrategyManager
2. Implement execution logic
3. Add parameter validation
4. Create tests and documentation
5. Add backtesting support

### API Development
- Follow RESTful conventions
- Use appropriate HTTP status codes
- Implement proper error handling
- Add request validation
- Document all endpoints

### Security Considerations
- Encrypt sensitive data (API keys, personal info)
- Validate all inputs
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines

## 🧪 Testing

### Running Tests
```bash
npm test                 # Run all tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage   # With coverage report
```

### Test Structure
```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── fixtures/          # Test data
└── helpers/           # Test utilities
```

### Writing Tests
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies
- Keep tests isolated and independent

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for public methods
- Document complex algorithms
- Include usage examples
- Keep documentation up to date

### API Documentation
- Document all endpoints
- Include request/response examples
- Specify required parameters
- Document error responses

## 🚀 Release Process

### Version Numbering
Follow Semantic Versioning (SemVer):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] Security review completed
- [ ] Performance testing done

## 🎯 Project Priorities

### High Priority
- Security improvements
- Performance optimizations
- Bug fixes
- Core feature stability

### Medium Priority
- New exchange integrations
- Additional trading strategies
- UI/UX improvements
- Advanced analytics

### Low Priority
- Experimental features
- Nice-to-have enhancements
- Code refactoring
- Documentation improvements

## 📞 Getting Help

- **GitHub Issues:** For bugs and feature requests
- **Discussions:** For questions and general discussion
- **Discord:** [Community Discord Server](#)
- **Email:** development@cryptocrowe.com

## 📜 Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Focus on constructive feedback
- Maintain professionalism
- Report inappropriate behavior

Thank you for contributing to CryptoCrowe! 🦅