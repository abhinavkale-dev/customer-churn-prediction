'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from "./ui/button";
import Logo from './Logo';

const Header = () => {
  return (
    <header className="border-b py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between w-full">
          <Logo />
          <Link href="/dashboard" className="ml-auto">
            <Button className="bg-black hover:bg-gray-800 text-white">
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 