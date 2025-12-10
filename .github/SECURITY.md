# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Plex Wrapped, please report it responsibly:

1. **Do NOT** create a public GitHub issue
2. Email security concerns to: jonthebeef@gmail.com
3. Include as much detail as possible about the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Security Measures

### Authentication
- Plex OAuth for user authentication (no passwords stored)
- Auth tokens stored in httpOnly cookies (not localStorage)
- CSRF protection enabled

### Data Privacy
- We only read your Plex listening history
- We do not modify your Plex library
- Cached stats can be deleted by the user
- No raw play history is stored, only aggregated stats

### Infrastructure
- All traffic over HTTPS
- Content Security Policy (CSP) headers configured
- Security headers: X-Frame-Options, X-Content-Type-Options, etc.
- Regular dependency audits via Dependabot

### Code Security
- All user inputs validated with Zod schemas
- No eval() or dynamic code execution
- Secrets managed via environment variables
- TruffleHog scanning for accidentally committed secrets

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
