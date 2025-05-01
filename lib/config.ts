export const siteConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 
           process.env.NODE_ENV === 'production' ? 'https://churn.abhinavkale.tech' : 
           'http://localhost:3000',
           
  // Site name
  name: 'Customer Churn Prediction',
  // Site description
  description: 'Advanced analytics for predicting and preventing customer churn',
  
}; 