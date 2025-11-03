# Contributing to CampusPass (CampusPass)

Thank you for your interest in contributing to CampusPass! This document provides guidelines and instructions for contributing to the project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, education, socio-economic status
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at ajaykrishnatech@gmail.com. All complaints will be reviewed and investigated promptly and fairly.

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js (v14+)
- MongoDB (v4.4+)
- Git
- A GitHub account
- Basic knowledge of TypeScript and Fastify

### First-Time Contributors

If you're new to open source:
1. Read the [README.md](README.md) to understand the project
2. Check out [good first issues](https://github.com/ajaykrishnavemula/CampusPass/labels/good%20first%20issue)
3. Join our community discussions
4. Ask questions - we're here to help!

---

## 💻 Development Setup

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/CampusPass.git
cd CampusPass/backend
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/ajaykrishnavemula/CampusPass.git
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your local configuration
```

### 6. Start Development Server

```bash
npm run dev
```

### 7. Verify Setup

```bash
# Test the API
curl http://localhost:3000/api/v1/health
```

---

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

#### 🐛 Bug Reports
- Use the bug report template
- Include steps to reproduce
- Provide expected vs actual behavior
- Include system information

#### ✨ Feature Requests
- Use the feature request template
- Explain the use case
- Describe the proposed solution
- Consider alternatives

#### 📝 Documentation
- Fix typos or unclear explanations
- Add examples and tutorials
- Improve API documentation
- Translate documentation

#### 💻 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Refactoring

### Finding Issues to Work On

1. **Good First Issues**: Perfect for newcomers
   - Label: `good first issue`
   - Usually small, well-defined tasks

2. **Help Wanted**: Issues that need attention
   - Label: `help wanted`
   - May require more experience

3. **Bug Fixes**: Critical issues
   - Label: `bug`
   - High priority

4. **Enhancements**: New features
   - Label: `enhancement`
   - Requires discussion first

---

## 📏 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Use explicit types
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // Implementation
}

// ❌ Bad: Avoid 'any' type
function getUser(id: any): any {
  // Implementation
}
```

### Naming Conventions

```typescript
// Classes: PascalCase
class PermitManager {}

// Functions/Variables: camelCase
const getUserById = () => {};
let studentCount = 0;

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'http://api.example.com';

// Interfaces: PascalCase with 'I' prefix (optional)
interface IPermit {}
// or
interface Permit {}

// Types: PascalCase
type UserRole = 'student' | 'warden' | 'security' | 'admin';
```

### File Structure

```typescript
// 1. Imports (grouped)
import { FastifyInstance } from 'fastify';
import { someUtil } from '../utils';

// 2. Types/Interfaces
interface RequestBody {
  id: string;
  name: string;
}

// 3. Constants
const MAX_PERMITS = 100;

// 4. Main logic
export default async (fastify: FastifyInstance) => {
  // Implementation
};

// 5. Helper functions (if needed)
function helperFunction() {
  // Implementation
}
```

### Code Style

```typescript
// ✅ Good: Clear, readable code
async function createPermit(data: PermitData): Promise<Permit> {
  // Validate input
  if (!data.id || !data.name) {
    throw new Error('Missing required fields');
  }

  // Create permit
  const permit = await Permit.create({
    id: data.id,
    name: data.name,
    status: 'pending',
    createdAt: new Date(),
  });

  return permit;
}

// ❌ Bad: Unclear, hard to read
async function cp(d: any) {
  if (!d.id || !d.name) throw new Error('err');
  return await Permit.create({ id: d.id, name: d.name, status: 'pending', createdAt: new Date() });
}
```

### Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  const result = await someAsyncOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed:', error);
  throw new AppError(500, 'Operation failed');
}

// ❌ Bad: Silent failures
try {
  await someAsyncOperation();
} catch (error) {
  // Silent failure
}
```

### Comments

```typescript
// ✅ Good: Meaningful comments
/**
 * Creates a new outpass permit for a student
 * @param data - Permit data including student info and time details
 * @returns Created permit with auto-approval status
 * @throws {ValidationError} If required fields are missing
 */
async function createPermit(data: PermitData): Promise<Permit> {
  // Check if student has any active violations
  const hasViolations = await checkViolations(data.id);
  
  // Auto-approve if no violations
  const status = hasViolations ? 'pending' : 'approved';
  
  return await Permit.create({ ...data, status });
}

// ❌ Bad: Obvious or redundant comments
// This function creates a permit
async function createPermit(data: PermitData): Promise<Permit> {
  // Create permit
  return await Permit.create(data);
}
```

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT refresh token support"

# Bug fix
git commit -m "fix(permits): resolve auto-approval logic error"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(handlers): extract common validation logic"

# Multiple changes
git commit -m "feat(notifications): add email notification system

- Implement email service using Nodemailer
- Add notification templates
- Create notification queue
- Add tests for email service

Closes #123"
```

### Commit Best Practices

1. **Keep commits atomic**: One logical change per commit
2. **Write clear messages**: Explain what and why, not how
3. **Reference issues**: Use `Closes #123` or `Fixes #456`
4. **Use present tense**: "Add feature" not "Added feature"
5. **Keep subject line short**: Max 50 characters

---

## 🔄 Pull Request Process

### Before Submitting

1. **Update your fork**:
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

2. **Create a feature branch**:
```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes**:
```bash
# Edit files
git add .
git commit -m "feat: your feature description"
```

4. **Push to your fork**:
```bash
git push origin feature/your-feature-name
```

### Submitting the PR

1. Go to the original repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template:
   - **Title**: Clear, descriptive title
   - **Description**: What changes were made and why
   - **Related Issues**: Link to related issues
   - **Screenshots**: If UI changes
   - **Testing**: How you tested the changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks**: CI/CD pipeline runs
2. **Code review**: Maintainers review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, PR will be merged

### After Merge

1. **Delete your branch**:
```bash
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

2. **Update your fork**:
```bash
git checkout main
git pull upstream main
git push origin main
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.spec.ts

# Watch mode
npm test -- --watch
```

### Writing Tests

```typescript
// Example test file: permit.test.ts
import { createPermit } from '../handlers/permit';

describe('Permit Handler', () => {
  describe('createPermit', () => {
    it('should create a permit with valid data', async () => {
      const data = {
        id: 'student123',
        name: 'John Doe',
        phoneNumber: '9876543210',
        outTime: new Date(),
        inTime: new Date(),
        purpose: 1,
        hostel: 'h1',
      };

      const result = await createPermit(data);

      expect(result).toBeDefined();
      expect(result.id).toBe(data.id);
      expect(result.status).toBe('approved');
    });

    it('should throw error with invalid data', async () => {
      const data = { id: '' };

      await expect(createPermit(data)).rejects.toThrow();
    });
  });
});
```

---

## 📚 Documentation

### Code Documentation

```typescript
/**
 * Creates a new outpass permit for a student
 * 
 * This function handles the complete permit creation process including:
 * - Input validation
 * - Violation checking
 * - Auto-approval logic
 * - Database persistence
 * 
 * @param data - Permit creation data
 * @param data.id - Student ID
 * @param data.name - Student name
 * @param data.phoneNumber - Contact number (10 digits)
 * @param data.outTime - Expected out time (ISO 8601)
 * @param data.inTime - Expected in time (ISO 8601)
 * @param data.purpose - Purpose code (0-5)
 * @param data.hostel - Hostel code (h1-h4)
 * 
 * @returns Promise resolving to created permit
 * @throws {ValidationError} If input validation fails
 * @throws {DatabaseError} If database operation fails
 * 
 * @example
 * ```typescript
 * const permit = await createPermit({
 *   id: 'student123',
 *   name: 'John Doe',
 *   phoneNumber: '9876543210',
 *   outTime: new Date('2024-01-15T10:00:00Z'),
 *   inTime: new Date('2024-01-15T18:00:00Z'),
 *   purpose: 1,
 *   hostel: 'h1'
 * });
 * ```
 */
async function createPermit(data: PermitData): Promise<Permit> {
  // Implementation
}
```

### README Updates

When adding new features, update:
- Feature list
- API documentation
- Configuration options
- Examples

---

## 👥 Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Email**: ajaykrishnatech@gmail.com
- **Discussions**: GitHub Discussions (coming soon)

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

---

## 📋 Checklist for Contributors

Before submitting your contribution:

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow guidelines
- [ ] PR template filled out completely
- [ ] No merge conflicts
- [ ] Self-review completed

---

## 🎉 Thank You!

Thank you for contributing to CampusPass! Your efforts help make this project better for everyone.

**Questions?** Don't hesitate to ask! We're here to help.

---

**Happy Contributing! 🚀**