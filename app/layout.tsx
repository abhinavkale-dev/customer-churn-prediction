import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Customer Churn Prediction',
  description: 'Advanced analytics for predicting and preventing customer churn',
  openGraph: {
    title: 'Customer Churn Prediction',
    description: 'Advanced analytics for predicting and preventing customer churn',
    images: [
      {
        url: '/public/customer-churn-landing.png',
        width: 1200,
        height: 630,
        alt: 'Customer Churn Landing Page',
      },
    ],
  },
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        sizes: 'any',
      }
    ],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
