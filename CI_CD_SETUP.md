# CI/CD Setup Guide for InscribeMate

This document explains the Continuous Integration and Continuous Deployment (CI/CD) setup for the InscribeMate project.

## Overview

We've implemented a comprehensive CI/CD pipeline using GitHub Actions to automate testing, building, and deployment processes. This ensures code quality and streamlines the deployment workflow.

## Workflow Files

The CI/CD configuration is split into three main workflow files:

### 1. `ci-cd.yml`

This is the main CI/CD pipeline that handles building and deploying the frontend application.

**Key features:**
- Triggers on pushes to `main` branch and pull requests
- Builds the application
- Deploys preview environments for pull requests
- Deploys to production when changes are merged to `main`

### 2. `server-deploy.yml`

Handles the deployment of the backend server and Supabase functions.

**Key features:**
- Triggers on pushes to `main` branch that affect server code
- Deploys the server to Railway
- Deploys Supabase Edge Functions

### 3. `testing.yml`

Focuses on running tests to ensure code quality.

**Key features:**
- Runs linting checks
- Executes unit tests
- Performs end-to-end testing with Cypress

## Required Secrets

To make these workflows function properly, you need to configure the following secrets in your GitHub repository:

### For Frontend Deployment
- `NETLIFY_AUTH_TOKEN`: Your Netlify authentication token
- `NETLIFY_SITE_ID`: The ID of your Netlify site

### For Server Deployment
- `RAILWAY_TOKEN`: Your Railway deployment token
- `RAILWAY_PROJECT_ID`: The ID of your Railway project

### For Supabase Functions
- `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
- `SUPABASE_PROJECT_ID`: The ID of your Supabase project

### For Testing
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key

## Setting Up Secrets

1. Go to your GitHub repository
2. Click on "Settings"
3. Navigate to "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Add each of the required secrets listed above

## Workflow Customization

You may need to customize these workflows based on your specific deployment needs:

- **Build Commands**: Adjust the build commands if your project structure changes
- **Deployment Targets**: Update the deployment targets if you switch hosting providers
- **Node Version**: Change the Node.js version if your application requires a different version

## Local Development

While the CI/CD pipeline handles deployment, for local development:

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the necessary environment variables
4. Run the development server with `npm run dev`

## Troubleshooting

If you encounter issues with the CI/CD pipeline:

1. Check the GitHub Actions logs for detailed error messages
2. Verify that all required secrets are correctly configured
3. Ensure your code passes all tests locally before pushing
4. Check if there are any conflicts between dependencies

## Future Improvements

Potential enhancements to the CI/CD setup:

- Add performance testing
- Implement automated accessibility testing
- Set up monitoring and alerting
- Configure automatic database migrations