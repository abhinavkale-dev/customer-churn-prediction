# Customer Churn Prediction Platform

<div align="center">

<img src="public/customer-churn-dashboard.png" alt="Churn Dashboard" width="80%" />
<br />
<sub><b>Churn Analytics Dashboard – Visualize churn metrics and KPIs</b></sub>

<br /><br />

<img src="public/customer-churn-landing.png" alt="Landing Page" width="80%" />
<br />
<sub><b>Landing Page – Modern, responsive entry point for the platform</b></sub>

</div>

## 🚀 Overview

The Customer Churn Prediction Platform is a powerful SaaS application built with Next.js that helps businesses identify and reduce customer churn. Using machine learning, this platform provides actionable insights to retain customers and optimize business strategies.

### 🔍 Key Features

- **Machine Learning Churn Prediction**: Neural network model that adapts to your business data
- **Adaptive Training**: Model improves over time as it learns from historical data
- **Batch Processing**: Handles up to 1000 users at once with efficient batch processing
- **Dashboard Analytics**: Visualize churn metrics with customizable KPI cards
- **Real-time Alerts**: Get notified about high-risk customers automatically
- **Automatic Distribution Calibration**: Ensures predictions maintain desired risk distribution (45% Low, 35% Medium, 20% High)
- **Revenue Optimization**: Correctly calculates revenue based on subscription plans
- **User Management**: Track and manage user activity and subscription status

## 🏗️ Project Architecture

<div align="center">
<img src="public/project-architecture.png" alt="Project Architecture" width="100%" />
<br />
<sub><b>Comprehensive architecture diagram showing the system's components and data flow</b></sub>
</div>

<br />

The application follows a modern, scalable architecture:

- **Frontend Layer**: Next.js pages and components with React hooks for state management
- **API Layer**: RESTful endpoints handling data operations and ML model interactions
- **Service Layer**: Business logic, ML processing, and external integrations
- **Data Layer**: PostgreSQL database with Prisma ORM for type-safe queries
- **Infrastructure**: Deployed on Vercel with serverless functions

## 💻 Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn UI, React Query
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Machine Learning**: Neural Network using brain.js
- **Deployment**: Vercel

## 🔧 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/churn-analysis-nextjs.git
cd churn-analysis-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your database credentials
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Train the ML model with synthetic data:
```bash
npx ts-node scripts/train-ml-model.ts
```

6. Start the development server:
```bash
npm run dev
```

## 🧠 Machine Learning Model

The platform uses a neural network implementation with the following characteristics:

- **Architecture**: 6-node input layer → 6-node hidden layer → 4-node hidden layer → 1-node output layer
- **Features**: Plan type (one-hot encoded), days since activity, event count, revenue
- **Training**: Learns from historical prediction data and user behavior
- **Adaptation**: Self-improves as more data becomes available
- **Fallback**: Includes rule-based fallback if model fails or isn't trained yet
- **Calibration**: Post-processes predictions to ensure desired risk distribution

## 📈 Performance

- **Batch Processing**: Processes 1000 users in 10-15 seconds
- **Database Operations**: Uses parallel queries and batch updates
- **Server Load**: Automatically rate-limited to prevent server overload
- **Memory Usage**: Efficient tensor management prevents memory leaks

## 🔒 Security

- **Data Validation**: Input validation for all API endpoints
- **Error Handling**: Comprehensive error handling with graceful fallbacks
- **API Rate Limiting**: Prevents abuse of prediction endpoints
- **Cross-Origin Security**: Properly configured CORS headers

## 📖 Documentation

API documentation is available at `/api/docs` when running the development server.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm/yarn
- Database setup (PostgreSQL recommended)
- AWS account for email capabilities (optional)
- OpenAI API key for chatbot functionality

### Installation

```bash
# Clone the repository
git clone https://github.com/abhinavkale-dev/customer-churn-prediction.git

# Navigate to the project directory
cd customer-churn-prediction

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npm run seed

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/churn_prediction"

# AWS Configuration for Email Sending
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
SES_FROM_ADDRESS="noreply@yourdomain.com"
TEST_EMAIL="your-test-email@example.com"

# OpenAI API (for Chatbot)
OPENAI_API_KEY="your_openai_api_key"

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



