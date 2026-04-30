'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DentalChartProps {
  toothType: 'permanent' | 'temporary';
  selectedTeeth: string[];
  onToothSelect: (toothNumber: string) => void;
  teethWithProcedures?: Record<string, { procedures: string[] }>;
  customToothName?: string;
  onAddCustomTooth?: (name: string) => void;
}

// Universal numbering for permanent teeth
const permanentUpperRight = ['1', '2', '3', '4', '5', '6', '7', '8'];
const permanentUpperLeft = ['9', '10', '11', '12', '13', '14', '15', '16'];
const permanentLowerLeft = ['17', '18', '19', '20', '21', '22', '23', '24'];
const permanentLowerRight = ['25', '26', '27', '28', '29', '30', '31', '32'];

// Letter system for temporary (deciduous) teeth
const temporaryUpperRight = ['A', 'B', 'C', 'D', 'E'];
const temporaryUpperLeft = ['F', 'G', 'H', 'I', 'J'];
const temporaryLowerLeft = ['K', 'L', 'M', 'N', 'O'];
const temporaryLowerRight = ['P', 'Q', 'R', 'S', 'T'];

const permanentNames: Record<string, string> = {
  '1': '3rd Molar (UR)', '2': '2nd Molar (UR)', '3': '1st Molar (UR)', '4': '2nd Premolar (UR)',
  '5': '1st Premolar (UR)', '6': 'Canine (UR)', '7': 'Lateral Incisor (UR)', '8': 'Central Incisor (UR)',
  '9': 'Central Incisor (UL)', '10': 'Lateral Incisor (UL)', '11': 'Canine (UL)', '12': '1st Premolar (UL)',
  '13': '2nd Premolar (UL)', '14': '1st Molar (UL)', '15': '2nd Molar (UL)', '16': '3rd Molar (UL)',
  '17': '3rd Molar (LL)', '18': '2nd Molar (LL)', '19': '1st Molar (LL)', '20': '2nd Premolar (LL)',
  '21': '1st Premolar (LL)', '22': 'Canine (LL)', '23': 'Lateral Incisor (LL)', '24': 'Central Incisor (LL)',
  '25': 'Central Incisor (LR)', '26': 'Lateral Incisor (LR)', '27': 'Canine (LR)', '28': '1st Premolar (LR)',
  '29': '2nd Premolar (LR)', '30': '1st Molar (LR)', '31': '2nd Molar (LR)', '32': '3rd Molar (LR)',
};

const temporaryNames: Record<string, string> = {
  'A': '2nd Molar (UR)', 'B': '1st Molar (UR)', 'C': 'Canine (UR)',
  'D': 'Lateral Incisor (UR)', 'E': 'Central Incisor (UR)',
  'F': 'Central Incisor (UL)', 'G': 'Lateral Incisor (UL)', 'H': 'Canine (UL)',
  'I': '1st Molar (UL)', 'J': '2nd Molar (UL)',
  'K': '2nd Molar (LL)', 'L': '1st Molar (LL)', 'M': 'Canine (LL)',
  'N': 'Lateral Incisor (LL)', 'O': 'Central Incisor (LL)',
  'P': 'Central Incisor (LR)', 'Q': 'Lateral Incisor (LR)', 'R': 'Canine (LR)',
  'S': '1st Molar (LR)', 'T': '2nd Molar (LR)',
};

// Tooth type classification based on universal numbering
type ToothShapeType = 'CentIncisor' | 'LatIncisor' | 'Canine' | '1stPremolar' | '2ndPremolar' | '1stMolar' | '2ndMolar' | '3rdMolar';

function getPermanentToothShape(num: string): ToothShapeType {
  const pos = ((parseInt(num) - 1) % 8) + 1;
  switch (pos) {
    case 1: return '3rdMolar';
    case 2: return '2ndMolar';
    case 3: return '1stMolar';
    case 4: return '2ndPremolar';
    case 5: return '1stPremolar';
    case 6: return 'Canine';
    case 7: return 'LatIncisor';
    case 8: return 'CentIncisor';
    default: return 'CentIncisor';
  }
}

function getTemporaryToothShape(letter: string): ToothShapeType {
  const map: Record<string, ToothShapeType> = {
    'A': '2ndMolar', 'B': '1stMolar', 'C': 'Canine', 'D': 'LatIncisor', 'E': 'CentIncisor',
    'F': 'CentIncisor', 'G': 'LatIncisor', 'H': 'Canine', 'I': '1stMolar', 'J': '2ndMolar',
    'K': '2ndMolar', 'L': '1stMolar', 'M': 'Canine', 'N': 'LatIncisor', 'O': 'CentIncisor',
    'P': 'CentIncisor', 'Q': 'LatIncisor', 'R': 'Canine', 'S': '1stMolar', 'T': '2ndMolar',
  };
  return map[letter] || 'CentIncisor';
}

// SVG Tooth Component - renders anatomically shaped tooth figures
function ToothSVG({ shape, isUpper, state }: {
  shape: ToothShapeType;
  isUpper: boolean;
  state: 'normal' | 'selected' | 'procedure';
}) {
  // Colors based on state
  const crownFill = state === 'selected' ? '#bbf7d0' : state === 'procedure' ? '#fef3c7' : '#fef9c3';
  const dentinFill = state === 'selected' ? '#6ee7b7' : state === 'procedure' ? '#fbbf24' : '#fde68a';
  const rootFill = state === 'selected' ? '#a7f3d0' : state === 'procedure' ? '#e5e0d8' : '#d6d3d1';
  const strokeColor = state === 'selected' ? '#34d399' : state === 'procedure' ? '#f59e0b' : '#a8a29e';
  const sw = 1.0;

  const renderUpperTooth = () => {
    switch (shape) {
      case 'CentIncisor':
        return (
          <g>
            <path d="M-14,4 Q-16,2 -15,0 L-13,-16 Q-12,-24 -8,-26 L8,-26 Q12,-24 13,-16 L15,0 Q16,2 14,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-10,2 Q-11,-4 -10,-14 Q-9,-20 -5,-22 L5,-22 Q9,-20 10,-14 Q11,-4 10,2 Z"
              fill={dentinFill} stroke="none" />
            <ellipse cx="0" cy="-10" rx="4" ry="7" fill="#fcd34d" opacity="0.4" />
            <path d="M-10,4 Q-12,12 -8,28 Q-4,36 0,38 Q4,36 8,28 Q12,12 10,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <line x1="-12" y1="1" x2="12" y2="1" stroke={strokeColor} strokeWidth="0.5" opacity="0.4" />
          </g>
        );
      case 'LatIncisor':
        return (
          <g>
            <path d="M-12,4 Q-14,2 -13,0 L-11,-16 Q-10,-24 -6,-26 L6,-26 Q10,-24 11,-16 L13,0 Q14,2 12,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-8,2 Q-9,-4 -8,-14 Q-7,-20 -3,-22 L3,-22 Q7,-20 8,-14 Q9,-4 8,2 Z"
              fill={dentinFill} stroke="none" />
            <ellipse cx="0" cy="-10" rx="3.5" ry="6" fill="#fcd34d" opacity="0.4" />
            <path d="M-8,4 Q-10,14 -6,32 Q-2,40 0,42 Q2,40 6,32 Q10,14 8,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <line x1="-10" y1="1" x2="10" y2="1" stroke={strokeColor} strokeWidth="0.5" opacity="0.4" />
          </g>
        );
      case 'Canine':
        return (
          <g>
            <path d="M-11,4 Q-13,2 -12,-2 L-9,-14 Q-6,-24 0,-28 Q6,-24 9,-14 L12,-2 Q13,2 11,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-7,2 Q-8,-4 -6,-14 Q-3,-22 0,-24 Q3,-22 6,-14 Q8,-4 7,2 Z"
              fill={dentinFill} stroke="none" />
            <ellipse cx="0" cy="-8" rx="3" ry="8" fill="#fcd34d" opacity="0.4" />
            <circle cx="0" cy="-24" r="1.5" fill={crownFill} opacity="0.7" />
            <path d="M-7,4 Q-9,16 -5,36 Q-2,44 0,46 Q2,44 5,36 Q9,16 7,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '1stPremolar':
        return (
          <g>
            <path d="M-13,4 Q-15,2 -14,-2 L-12,-14 Q-10,-22 -6,-24 L-2,-26 Q0,-28 2,-26 L6,-24 Q10,-22 12,-14 L14,-2 Q15,2 13,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-9,2 Q-10,-4 -9,-12 Q-7,-18 -4,-20 L4,-20 Q7,-18 9,-12 Q10,-4 9,2 Z"
              fill={dentinFill} stroke="none" />
            <path d="M-6,-24 Q-5,-28 -3,-26" fill={crownFill} stroke={strokeColor} strokeWidth="0.7" />
            <path d="M3,-24 Q4,-28 6,-26" fill={crownFill} stroke={strokeColor} strokeWidth="0.7" />
            <ellipse cx="0" cy="-8" rx="4" ry="7" fill="#fcd34d" opacity="0.4" />
            <path d="M-9,4 Q-11,14 -7,30 Q-3,38 0,38 Q3,38 7,30 Q11,14 9,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '2ndPremolar':
        return (
          <g>
            <path d="M-12,4 Q-14,2 -13,-2 L-11,-14 Q-9,-22 -5,-24 L-1,-26 Q1,-28 3,-26 L5,-24 Q9,-22 11,-14 L13,-2 Q14,2 12,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-8,2 Q-9,-4 -8,-12 Q-6,-18 -3,-20 L3,-20 Q6,-18 8,-12 Q9,-4 8,2 Z"
              fill={dentinFill} stroke="none" />
            <path d="M-5,-24 Q-4,-27 -2,-25" fill={crownFill} stroke={strokeColor} strokeWidth="0.7" />
            <path d="M2,-24 Q3,-27 5,-25" fill={crownFill} stroke={strokeColor} strokeWidth="0.7" />
            <ellipse cx="0" cy="-8" rx="3.5" ry="6" fill="#fcd34d" opacity="0.4" />
            <path d="M-8,4 Q-10,14 -6,30 Q-2,38 0,38 Q2,38 6,30 Q10,14 8,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '1stMolar':
        return (
          <g>
            <path d="M-16,4 Q-18,2 -17,-2 L-15,-14 Q-13,-22 -8,-26 L-4,-28 Q0,-30 4,-28 L8,-26 Q13,-22 15,-14 L17,-2 Q18,2 16,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-12,2 Q-13,-4 -12,-12 Q-10,-18 -6,-22 L6,-22 Q10,-18 12,-12 Q13,-4 12,2 Z"
              fill={dentinFill} stroke="none" />
            <circle cx="-6" cy="-24" r="2.5" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <circle cx="6" cy="-24" r="2.5" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <circle cx="-4" cy="-19" r="2" fill={crownFill} stroke={strokeColor} strokeWidth="0.4" opacity="0.6" />
            <circle cx="4" cy="-19" r="2" fill={crownFill} stroke={strokeColor} strokeWidth="0.4" opacity="0.6" />
            <path d="M-6,-24 L0,-20 L6,-24" fill="none" stroke={strokeColor} strokeWidth="0.4" opacity="0.5" />
            <path d="M0,-20 L0,-14" fill="none" stroke={strokeColor} strokeWidth="0.4" opacity="0.5" />
            <ellipse cx="0" cy="-8" rx="6" ry="8" fill="#fcd34d" opacity="0.4" />
            <path d="M-12,4 Q-14,12 -12,22 Q-10,30 -8,34 Q-6,30 -5,22 Q-4,12 -5,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-3,4 Q-4,16 -2,28 Q0,34 2,28 Q4,16 3,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M5,4 Q4,12 5,22 Q7,30 10,34 Q12,30 13,22 Q14,12 12,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '2ndMolar':
        return (
          <g>
            <path d="M-15,4 Q-17,2 -16,-2 L-14,-14 Q-12,-22 -7,-25 L-3,-27 Q0,-28 3,-27 L7,-25 Q12,-22 14,-14 L16,-2 Q17,2 15,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-11,2 Q-12,-4 -11,-12 Q-9,-18 -5,-21 L5,-21 Q9,-18 11,-12 Q12,-4 11,2 Z"
              fill={dentinFill} stroke="none" />
            <circle cx="-5" cy="-23" r="2.2" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <circle cx="5" cy="-23" r="2.2" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <circle cx="-3" cy="-18" r="1.8" fill={crownFill} stroke={strokeColor} strokeWidth="0.4" opacity="0.6" />
            <circle cx="3" cy="-18" r="1.8" fill={crownFill} stroke={strokeColor} strokeWidth="0.4" opacity="0.6" />
            <ellipse cx="0" cy="-8" rx="5" ry="7" fill="#fcd34d" opacity="0.4" />
            <path d="M-11,4 Q-13,12 -11,20 Q-9,28 -7,32 Q-5,28 -4,20 Q-3,12 -4,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-2,4 Q-3,14 -1,26 Q0,30 1,26 Q3,14 2,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M4,4 Q3,12 4,20 Q6,28 9,32 Q11,28 12,20 Q13,12 11,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '3rdMolar':
        return (
          <g>
            <path d="M-13,4 Q-15,2 -14,-2 L-12,-12 Q-10,-20 -6,-23 L-2,-25 Q0,-26 2,-25 L6,-23 Q10,-20 12,-12 L14,-2 Q15,2 13,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-9,2 Q-10,-4 -9,-10 Q-7,-16 -4,-19 L4,-19 Q7,-16 9,-10 Q10,-4 9,2 Z"
              fill={dentinFill} stroke="none" />
            <circle cx="-3" cy="-21" r="2" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <circle cx="3" cy="-21" r="2" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <ellipse cx="0" cy="-7" rx="4.5" ry="6" fill="#fcd34d" opacity="0.4" />
            <path d="M-9,4 Q-11,14 -8,24 Q-5,32 -2,36 Q0,34 1,28 Q2,20 0,12 Q-1,6 -2,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M2,4 Q3,10 4,18 Q5,28 4,34 Q6,32 8,24 Q10,14 9,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      default:
        return null;
    }
  };

  const renderLowerTooth = () => {
    switch (shape) {
      case 'CentIncisor':
        return (
          <g transform="translate(28,48) scale(1,-1)">
            <path d="M-11,4 Q-13,2 -12,0 L-10,-14 Q-9,-22 -5,-24 L5,-24 Q9,-22 10,-14 L12,0 Q13,2 11,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-7,2 Q-8,-4 -7,-12 Q-5,-18 -2,-20 L2,-20 Q5,-18 7,-12 Q8,-4 7,2 Z"
              fill={dentinFill} stroke="none" />
            <ellipse cx="0" cy="-8" rx="3" ry="5" fill="#fcd34d" opacity="0.4" />
            <path d="M-7,4 Q-9,16 -5,30 Q-2,36 0,38 Q2,36 5,30 Q9,16 7,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case 'LatIncisor':
        return (
          <g transform="translate(28,48) scale(1,-1)">
            <path d="M-12,4 Q-14,2 -13,0 L-11,-14 Q-10,-22 -6,-24 L6,-24 Q10,-22 11,-14 L13,0 Q14,2 12,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-8,2 Q-9,-4 -8,-12 Q-6,-18 -3,-20 L3,-20 Q6,-18 8,-12 Q9,-4 8,2 Z"
              fill={dentinFill} stroke="none" />
            <ellipse cx="0" cy="-8" rx="3.5" ry="5.5" fill="#fcd34d" opacity="0.4" />
            <path d="M-8,4 Q-10,16 -6,32 Q-2,40 0,42 Q2,40 6,32 Q10,16 8,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case 'Canine':
        return (
          <g transform="translate(28,48) scale(1,-1)">
            <path d="M-11,4 Q-13,2 -12,-2 L-9,-14 Q-6,-22 0,-26 Q6,-22 9,-14 L12,-2 Q13,2 11,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-7,2 Q-8,-4 -6,-14 Q-3,-20 0,-22 Q3,-20 6,-14 Q8,-4 7,2 Z"
              fill={dentinFill} stroke="none" />
            <ellipse cx="0" cy="-8" rx="3" ry="7" fill="#fcd34d" opacity="0.4" />
            <circle cx="0" cy="-22" r="1.5" fill={crownFill} opacity="0.7" />
            <path d="M-7,4 Q-9,18 -5,38 Q-2,46 0,48 Q2,46 5,38 Q9,18 7,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '1stPremolar':
        return (
          <g transform="translate(28,48) scale(1,-1)">
            <path d="M-12,4 Q-14,2 -13,-2 L-11,-14 Q-9,-22 -5,-24 L-1,-26 Q1,-28 3,-26 L5,-24 Q9,-22 11,-14 L13,-2 Q14,2 12,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-8,2 Q-9,-4 -8,-12 Q-6,-18 -3,-20 L3,-20 Q6,-18 8,-12 Q9,-4 8,2 Z"
              fill={dentinFill} stroke="none" />
            <ellipse cx="0" cy="-8" rx="3.5" ry="6" fill="#fcd34d" opacity="0.4" />
            <path d="M-8,4 Q-10,14 -6,30 Q-2,38 0,38 Q2,38 6,30 Q10,14 8,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '2ndPremolar':
        return (
          <g transform="translate(28,48) scale(1,-1)">
            <path d="M-11,4 Q-13,2 -12,-2 L-10,-14 Q-8,-22 -4,-24 L0,-26 Q4,-24 8,-22 L10,-14 L12,-2 Q13,2 11,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-7,2 Q-8,-4 -7,-12 Q-5,-18 -2,-20 L2,-20 Q5,-18 7,-12 Q8,-4 7,2 Z"
              fill={dentinFill} stroke="none" />
            <ellipse cx="0" cy="-8" rx="3" ry="5.5" fill="#fcd34d" opacity="0.4" />
            <path d="M-7,4 Q-9,14 -5,30 Q-1,38 0,38 Q1,38 5,30 Q9,14 7,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '1stMolar':
        return (
          <g transform="translate(28,48) scale(1,-1)">
            <path d="M-15,4 Q-17,2 -16,-2 L-14,-14 Q-12,-22 -7,-26 L-3,-28 Q0,-29 3,-28 L7,-26 Q12,-22 14,-14 L16,-2 Q17,2 15,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-11,2 Q-12,-4 -11,-12 Q-9,-18 -5,-22 L5,-22 Q9,-18 11,-12 Q12,-4 11,2 Z"
              fill={dentinFill} stroke="none" />
            <circle cx="-5" cy="-24" r="2.2" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <circle cx="5" cy="-24" r="2.2" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <circle cx="-3" cy="-19" r="1.6" fill={crownFill} stroke={strokeColor} strokeWidth="0.4" opacity="0.6" />
            <circle cx="3" cy="-19" r="1.6" fill={crownFill} stroke={strokeColor} strokeWidth="0.4" opacity="0.6" />
            <ellipse cx="0" cy="-8" rx="5.5" ry="7" fill="#fcd34d" opacity="0.4" />
            <path d="M-10,4 Q-12,16 -9,28 Q-6,36 -4,38 Q-2,36 -1,28 Q0,16 -2,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M2,4 Q1,16 2,28 Q4,36 7,38 Q9,36 11,28 Q13,16 10,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '2ndMolar':
        return (
          <g transform="translate(28,48) scale(1,-1)">
            <path d="M-14,4 Q-16,2 -15,-2 L-13,-14 Q-11,-22 -6,-25 L-2,-27 Q0,-28 2,-27 L6,-25 Q11,-22 13,-14 L15,-2 Q16,2 14,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-10,2 Q-11,-4 -10,-12 Q-8,-18 -4,-21 L4,-21 Q8,-18 10,-12 Q11,-4 10,2 Z"
              fill={dentinFill} stroke="none" />
            <circle cx="-4" cy="-23" r="2" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <circle cx="4" cy="-23" r="2" fill={crownFill} stroke={strokeColor} strokeWidth="0.6" />
            <ellipse cx="0" cy="-8" rx="5" ry="6.5" fill="#fcd34d" opacity="0.4" />
            <path d="M-9,4 Q-11,14 -8,26 Q-5,34 -3,36 Q-1,34 0,26 Q1,14 -1,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M1,4 Q0,14 1,26 Q3,34 6,36 Q8,34 10,26 Q12,14 9,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      case '3rdMolar':
        return (
          <g transform="translate(28,48) scale(1,-1)">
            <path d="M-12,4 Q-14,2 -13,-2 L-11,-12 Q-9,-20 -5,-23 L-1,-25 Q1,-26 3,-25 L5,-23 Q9,-20 11,-12 L13,-2 Q14,2 12,4 Z"
              fill={crownFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M-8,2 Q-9,-4 -8,-10 Q-6,-16 -3,-19 L3,-19 Q6,-16 8,-10 Q9,-4 8,2 Z"
              fill={dentinFill} stroke="none" />
            <ellipse cx="0" cy="-7" rx="4" ry="5.5" fill="#fcd34d" opacity="0.4" />
            <path d="M-8,4 Q-10,14 -7,24 Q-4,32 -1,34 Q1,32 3,24 Q5,14 2,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
            <path d="M0,4 Q1,12 2,20 Q3,28 5,32 Q7,30 8,22 Q9,14 8,4 Z"
              fill={rootFill} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg width="32" height="42" viewBox="0 0 56 72" xmlns="http://www.w3.org/2000/svg">
      {isUpper ? renderUpperTooth() : renderLowerTooth()}
    </svg>
  );
}

function ToothButton({
  number,
  name,
  selected,
  hasProcedures,
  onClick,
  isUpper,
  isPrimary,
}: {
  number: string;
  name: string;
  selected: boolean;
  hasProcedures: boolean;
  onClick: () => void;
  isUpper: boolean;
  isPrimary?: boolean;
}) {
  const shape: ToothShapeType = isPrimary
    ? getTemporaryToothShape(number)
    : getPermanentToothShape(number);

  const state = selected ? 'selected' : hasProcedures ? 'procedure' : 'normal';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={`Tooth ${number}: ${name}`}
          className={cn(
              'relative flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 cursor-pointer p-1',
              'hover:scale-110 hover:shadow-md active:scale-95',
              selected
                ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-200'
                : hasProcedures
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-200 bg-white hover:border-gray-300',
              isPrimary ? 'w-11 h-16 sm:w-13 sm:h-18' : 'w-9 h-14 sm:w-11 sm:h-16'
            )}
          >
            <ToothSVG shape={shape} isUpper={isUpper} state={state} />
            <span className={cn(
              'font-bold leading-none',
              selected ? 'text-emerald-700' : hasProcedures ? 'text-amber-700' : 'text-gray-600',
              isPrimary ? 'text-[9px] sm:text-[10px]' : 'text-[8px] sm:text-[9px]'
            )}>
              {number}
            </span>
            {hasProcedures && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">#{number}</p>
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
  );
}

export default function DentalChart({
  toothType,
  selectedTeeth,
  onToothSelect,
  teethWithProcedures = {},
}: DentalChartProps) {
  const isPermanent = toothType === 'permanent';
  const names = isPermanent ? permanentNames : temporaryNames;

  const upperRight = isPermanent ? permanentUpperRight : temporaryUpperRight;
  const upperLeft = isPermanent ? permanentUpperLeft : temporaryUpperLeft;
  const lowerLeft = isPermanent ? permanentLowerLeft : temporaryLowerLeft;
  const lowerRight = isPermanent ? permanentLowerRight : temporaryLowerRight;

  return (
    <div className="w-full">
      <TooltipProvider>
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5 shadow-sm">
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mb-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#fef9c3] border border-gray-200" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-300" /> Selected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-300" /> Has Procedure
          </span>
        </div>

        {/* Upper Jaw */}
        <div className="mb-1">
          <div className="text-[10px] sm:text-xs text-center text-gray-400 font-medium mb-2 uppercase tracking-wider">Upper Jaw (Maxillary)</div>
          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            <div className="flex gap-0.5 sm:gap-1">
              {upperRight.map((num) => (
                <ToothButton
                  key={num}
                  number={num}
                  name={names[num]}
                  selected={selectedTeeth.includes(num)}
                  hasProcedures={!!teethWithProcedures[num]}
                  onClick={() => onToothSelect(num)}
                  isUpper={true}
                  isPrimary={!isPermanent}
                />
              ))}
            </div>
            {/* Midline */}
            <div className="w-1 sm:w-2 self-stretch flex items-center justify-center">
              <div className="w-px h-10 bg-gray-300" />
            </div>
            <div className="flex gap-0.5 sm:gap-1">
              {upperLeft.map((num) => (
                <ToothButton
                  key={num}
                  number={num}
                  name={names[num]}
                  selected={selectedTeeth.includes(num)}
                  hasProcedures={!!teethWithProcedures[num]}
                  onClick={() => onToothSelect(num)}
                  isUpper={true}
                  isPrimary={!isPermanent}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-1">
            <span className="text-[10px] text-gray-400">Right</span>
            <span className="text-[10px] text-gray-400">Left</span>
          </div>
        </div>

        {/* Separator */}
        <div className="my-3 sm:my-4 border-t-2 border-dashed border-gray-200" />

        {/* Lower Jaw */}
        <div>
          <div className="text-[10px] sm:text-xs text-center text-gray-400 font-medium mb-2 uppercase tracking-wider">Lower Jaw (Mandibular)</div>
          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
            <div className="flex gap-0.5 sm:gap-1">
              {lowerLeft.map((num) => (
                <ToothButton
                  key={num}
                  number={num}
                  name={names[num]}
                  selected={selectedTeeth.includes(num)}
                  hasProcedures={!!teethWithProcedures[num]}
                  onClick={() => onToothSelect(num)}
                  isUpper={false}
                  isPrimary={!isPermanent}
                />
              ))}
            </div>
            <div className="w-1 sm:w-2 self-stretch flex items-center justify-center">
              <div className="w-px h-10 bg-gray-300" />
            </div>
            <div className="flex gap-0.5 sm:gap-1">
              {lowerRight.map((num) => (
                <ToothButton
                  key={num}
                  number={num}
                  name={names[num]}
                  selected={selectedTeeth.includes(num)}
                  hasProcedures={!!teethWithProcedures[num]}
                  onClick={() => onToothSelect(num)}
                  isUpper={false}
                  isPrimary={!isPermanent}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-1">
            <span className="text-[10px] text-gray-400">Left</span>
            <span className="text-[10px] text-gray-400">Right</span>
          </div>
        </div>
      </div>
      </TooltipProvider>

      {/* Selected teeth display */}
      {selectedTeeth.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedTeeth.map((num) => (
            <span
              key={num}
              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-200"
            >
              #{num} {names[num]}
              <button
                onClick={() => onToothSelect(num)}
                aria-label={`Remove tooth ${num}`}
                className="ml-0.5 hover:text-emerald-900 cursor-pointer"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
