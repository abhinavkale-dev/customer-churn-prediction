# Customer Churn Prediction App

This is a Next.js application for predicting customer churn.

## Features

- Dashboard with key churn metrics
- Churn prediction using machine learning models
- Customer analytics
- User management
- Plan management

### TanStack Query Implementation

We've implemented TanStack Query (React Query) to improve the user experience by providing efficient data caching and avoiding loading states when users navigate between pages in the paginated areas. This implementation offers the following benefits:

- **Data Caching**: The app now caches fetched data, reducing the need for repeated API calls when navigating
- **Improved Pagination**: Moving between pages in the dashboard and churn prediction routes no longer shows loading states when the data is cached
- **Mutation Management**: Simplified API calls for actions like churn predictions
- **Automatic Refetching**: Smart refetching of data when needed
- **Better Error Handling**: Improved error states and management

The implementation includes:

1. A QueryProvider component that wraps the dashboard layout
2. Custom hooks for fetching users, dashboard data, and churn predictions
3. Updated components that use these hooks instead of direct fetch calls

## Development

### Prerequisites

- Node.js 16+
- NPM or Yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your environment variables (see `.env.example`)
4. Run the development server:
   ```
   npm run dev
   ```

## API Routes

The application includes several API routes:

- `/api/users` - User management
- `/api/dashboard-data` - Dashboard metrics
- `/api/churn-prediction` - Run churn predictions
- `/api/import-data` - Import user data
- `/api/download-data` - Export data


