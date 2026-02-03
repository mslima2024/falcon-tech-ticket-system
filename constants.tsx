
import React from 'react';
import { Product } from './types';

// Paleta de cores oficial Falcon Tech
export const APP_PURPLE_GRADIENT = "bg-gradient-to-br from-[#0052cc] via-[#003d99] to-[#001a33]";

export const FALCON_LOGO_SVG = (size: number = 40) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Corpo/Penas do Falcão em Degradê Azul */}
    <path d="M10 40C10 40 30 25 55 25C80 25 105 45 105 45C105 45 85 48 75 52C65 56 55 75 40 75C25 75 15 60 15 50C15 45 10 40 10 40Z" fill="url(#falcon_grad)" />
    
    {/* Detalhes de Velocidade/Penas superiores */}
    <path d="M15 35L45 28L70 35L40 40L15 35Z" fill="white" fillOpacity="0.3" />
    <path d="M20 45L50 42L75 48L45 52L20 45Z" fill="#60A5FA" fillOpacity="0.5" />
    
    {/* Cabeça e Bico (Branco/Prata) */}
    <path d="M85 40C85 40 95 38 105 45C108 47 110 52 102 52C95 52 85 48 85 48V40Z" fill="white" />
    <path d="M102 52C102 52 108 52 104 58C100 62 95 52 95 52L102 52Z" fill="#CBD5E1" />
    
    {/* Olho */}
    <circle cx="94" cy="44" r="1.5" fill="#001a33" />
    
    <defs>
      <linearGradient id="falcon_grad" x1="10" y1="25" x2="105" y2="75" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="0.5" stopColor="#2563EB" />
        <stop offset="1" stopColor="#1E3A8A" />
      </linearGradient>
    </defs>
  </svg>
);

export const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: 'Cerveja', price: 10.0, stock: 500, category: 'Bebida' },
  { id: '2', name: 'Refrigerante', price: 6.0, stock: 300, category: 'Bebida' },
  { id: '3', name: 'Água', price: 4.0, stock: 400, category: 'Bebida' },
  { id: '4', name: 'Almoço', price: 35.0, stock: 200, category: 'Comida' },
  { id: '5', name: 'Doce', price: 5.0, stock: 150, category: 'Sobremesa' },
  { id: '6', name: 'Salgado', price: 8.0, stock: 250, category: 'Lanche' },
];
