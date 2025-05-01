# Customer Churn Prediction Platform

![Churn Analytics Dashboard](https://placehold.co/800x400/6d28d9/white?text=Churn+Analytics+Dashboard)

## 🚀 Overview

The Customer Churn Prediction Platform is a powerful SaaS application built with Next.js that helps businesses identify and reduce customer churn. Using advanced analytics and AI-based predictions, this platform provides actionable insights to retain customers and optimize business strategies.

### 🔍 Key Features

- **Predictive Churn Analytics**: Identify at-risk customers before they leave
- **Customer Segmentation**: Categorize users into risk categories (Low, Medium, High)
- **Visual Dashboard**: Comprehensive view of churn metrics and KPIs
- **Personalized Retention Strategies**: AI-driven recommendations tailored to your business
- **Data Import/Export**: CSV and Excel report generation for deeper analysis
- **Email Reports**: Schedule and send automated reports to stakeholders

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TailwindCSS 4
- **State Management**: React Query (Tanstack Query)
- **UI Components**: Radix UI primitives with custom styling
- **Data Visualization**: Recharts for interactive graphs and charts
- **Notifications**: Sonner for toast notifications
- **Backend**: Next.js API routes with TypeScript
- **Database**: Prisma ORM with your preferred database
- **Email**: AWS SES integration for reliable email delivery
- **Authentication**: Custom authentication flow

## 📊 Dashboard Sections

The platform is organized into logical sections for comprehensive churn management:

### Main Dashboard
- Overview of key churn metrics
- Risk distribution statistics
- Recent predictions and high-risk customers

### Churn Prediction
- Predict churn probability for individual customers
- Batch prediction for all customers
- Detailed explanation of prediction factors

### Customer Analytics
- Customer behavior trends and patterns
- Plan distribution analysis
- Engagement metrics visualization

### Retention Strategies
- Personalized recommendations based on your data
- Implementation guidelines for each strategy
- Impact and effort assessment

### User Management
- Customer database with filtering and search
- Detailed user profiles
- Activity tracking and engagement metrics

## 📱 Responsive Design

The platform is fully responsive and works seamlessly on:
- Desktop monitors
- Tablets
- Mobile devices

## 💬 Interactive Chatbot Assistant

An in-app AI chatbot provides:
- Contextual help based on the current page
- Answers to questions about churn prediction
- Guidance on using platform features
- Quick navigation to relevant sections

## 🔄 Data Flow

1. **Import customer data** from CSV files or connect to your data source
2. **Analyze user behavior patterns** and engagement metrics
3. **Generate churn probability scores** for each customer
4. **Categorize users** into risk segments
5. **Recommend retention strategies** based on risk profiles
6. **Monitor effectiveness** of implemented strategies

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm/yarn
- Database setup (PostgreSQL recommended)
- AWS account for email capabilities (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/abhinavkale-dev/churn-analysis-nextjs.git

# Navigate to the project directory
cd churn-analysis-nextjs

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npm run seed

# Start development server
npm run dev
```

## 📊 Sample Data

The platform includes a seeding script that generates realistic customer data with:
- Various subscription plans
- Different churn risk profiles
- Activity patterns
- Revenue metrics

This allows you to test and demo the platform without connecting to real data sources.

## 📧 Email Reports

Generate and send comprehensive churn reports to stakeholders:
- CSV or Excel format options
- Customizable data filters
- Professionally styled email templates
- Scheduled or on-demand delivery

## 🔄 Continuous Improvement

This platform is continuously updated with:
- New prediction models
- Additional retention strategies
- Enhanced visualization options
- Performance optimizations

## The application includes several API routes:

- `/api/users` - User management
- `/api/dashboard-data` - Dashboard metrics
- `/api/churn-prediction` - Run churn predictions
- `/api/import-data` - Import user data
- `/api/download-data` - Export data


