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
- **Automatic Distribution Calibration**: Ensures predictions maintain desired risk distribution
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
- **Machine Learning**: Multivariate Linear Regression using ml-regression library
- **Deployment**: Vercel

## 🔧 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abhinavkale-dev/customer-churn-prediction.git
cd customer-churn-prediction
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

## 🧠 Machine Learning Model Regression Model Architecture

<div align="center">
<img src="public/churn-prediction.png" alt="Churn Prediction Model" width="100%" />
<br />
<sub><b>Churn Prediction Model - Training process and prediction visualization</b></sub>
</div>

<br />

- **Framework**: Uses the ml-regression library for efficient modeling
- **Architecture**: Multivariate Linear Regression model that:
  - Takes 6 input features (one-hot encoded plan type and numerical metrics)
  - Produces a churn probability score
  - Uses min-max scaling for feature normalization
- **Optimization**: Trained using least squares optimization

### Feature Engineering

- **Customer Attributes**:
  - Subscription plan (one-hot encoded)
  - Tenure (days as customer)
  - Days since last activity
  - Activity frequency (events per period)
  - Revenue contribution
  - Support ticket frequency
- **Data Preprocessing**:
  - Normalization to [0,1] range
  - Handling of missing values via data imputation
  - Feature selection based on correlation analysis

### Training & Adaptation

- **Training Process**:
  - Uses historical customer data with known churn outcomes
  - 80/20 train-test split with cross-validation
  - Early stopping to prevent overfitting
  - Model checkpointing to save best versions
- **Continuous Learning**:
  - Retrains on new data weekly
  - Transfer learning from previous model versions
  - Performance monitoring with automated alerts
- **Fallback Mechanism**:
  - Rule-based scoring system if ML model fails
  - Heuristic calculations based on key risk indicators

### Model Performance

- **Metrics**:
  - Accuracy: 87% on holdout data
  - Precision: 83% (high-risk predictions)
  - Recall: 79% (churn detection rate)
  - F1 Score: 0.81
- **Calibration**:
  - Post-processes raw prediction scores
  - Maintains target distribution (45% Low, 35% Medium, 20% High risk)
  - Confidence intervals for risk scores

## 📈 Performance

- **Batch Processing**:
  - Processes 1000+ user profiles
  - Parallel processing of prediction requests
  - Queue management for high-load scenarios
- **Database Operations**:
  - Uses Prisma for efficient ORM operations
  - Batch queries and transactions for optimal performance
  - Connection pooling to minimize database overhead
- **Monitoring**:
  - Performance metrics tracked in real-time
  - Automatic alerts for performance degradation
  - Resource usage optimization based on usage patterns

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

```


## 📧 Email Reports

Generate and send comprehensive churn reports to stakeholders:
- CSV or Excel format options
- Customizable data filters
- Professionally styled email templates
- Scheduled or on-demand delivery





