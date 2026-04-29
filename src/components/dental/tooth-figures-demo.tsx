'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ===================== STYLE 1: Anatomical SVG Outlines =====================
// Each tooth type has a realistic shape: incisors are flat/edge, canines are pointed, premolars have one cusp, molars have multiple cusps

function AnatomicalTooth({ number, type }: { number: string; type: 'incisor' | 'canine' | 'premolar' | 'molar' }) {
  const getPath = () => {
    switch (type) {
      case 'incisor':
        return 'M8 4 L6 8 L5 14 L5 22 L6 28 L8 32 L10 28 L11 22 L11 14 L10 8 Z';
      case 'canine':
        return 'M8 4 L5 10 L4 16 L5 22 L7 28 L9 32 L10 28 L11 22 L12 16 L11 10 Z';
      case 'premolar':
        return 'M6 4 L4 8 L4 16 L5 22 L6 28 L8 32 L10 28 L11 22 L12 16 L12 8 L10 4 L9 6 L8 4 L7 6 Z';
      case 'molar':
        return 'M5 4 L3 6 L3 16 L4 22 L5 28 L7 32 L11 32 L13 28 L14 22 L15 16 L15 6 L13 4 L12 6 L11 4 L9 6 L8 4 L7 6 Z';
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="18" height="36" viewBox="0 0 18 36">
        <path d={getPath()} fill="white" stroke="#6b7280" strokeWidth="1.2" />
        <line x1="5" y1="14" x2="13" y2="14" stroke="#d1d5db" strokeWidth="0.6" strokeDasharray="2,1" />
      </svg>
      <span className="text-[10px] font-bold text-gray-600">{number}</span>
    </div>
  );
}

// ===================== STYLE 2: Filled Tooth Icons =====================
// Tooth-shaped filled icons with a root, more like a dental diagram

function FilledTooth({ number, type }: { number: string; type: 'incisor' | 'canine' | 'premolar' | 'molar' }) {
  const crownColors: Record<string, string> = {
    incisor: '#e0f2fe',
    canine: '#fef3c7',
    premolar: '#fce7f3',
    molar: '#ecfdf5',
  };
  const rootColor = '#f9fafb';

  const getCrown = () => {
    switch (type) {
      case 'incisor': return 'M10 2 Q4 2 4 10 L4 18 L16 18 L16 10 Q16 2 10 2 Z';
      case 'canine': return 'M10 2 Q3 4 4 12 L5 18 L15 18 L16 12 Q17 4 10 2 Z';
      case 'premolar': return 'M10 2 Q3 3 4 12 L4 18 L16 18 L16 12 Q17 3 10 2 M8 2 L8 7 M12 2 L12 7';
      case 'molar': return 'M10 2 Q2 3 3 12 L3 18 L17 18 L17 12 Q18 3 10 2 M6 2 L6 7 M10 2 L10 7 M14 2 L14 7';
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="20" height="34" viewBox="0 0 20 34">
        {/* Root */}
        <path d="M6 18 L7 30 Q10 32 13 30 L14 18 Z" fill={rootColor} stroke="#9ca3af" strokeWidth="0.8" />
        {/* Crown */}
        <path d={getCrown()} fill={crownColors[type]} stroke="#6b7280" strokeWidth="1" fillRule="evenodd" />
        {/* CEJ line */}
        <line x1="4" y1="18" x2="16" y2="18" stroke="#9ca3af" strokeWidth="0.5" />
      </svg>
      <span className="text-[10px] font-bold text-gray-600">{number}</span>
    </div>
  );
}

// ===================== STYLE 3: Top-Down (Occlusal) View =====================
// Shows the biting surface from above - circles/ovals with cusps marked

function OcclusalTooth({ number, type }: { number: string; type: 'incisor' | 'canine' | 'premolar' | 'molar' }) {
  const getShape = () => {
    switch (type) {
      case 'incisor': return { rx: 5, ry: 4, cusps: [[0, -1]] };
      case 'canine': return { rx: 4.5, ry: 5, cusps: [[0, -2]] };
      case 'premolar': return { rx: 5.5, ry: 5, cusps: [[-1.5, -1], [1.5, -1]] };
      case 'molar': return { rx: 7, ry: 6, cusps: [[-2.5, -2], [-0.8, -2], [0.8, -2], [2.5, -2]] };
    }
  };
  const shape = getShape();

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <ellipse cx="10" cy="10" rx={shape.rx} ry={shape.ry} fill="#fefce8" stroke="#6b7280" strokeWidth="1" />
        {shape.cusps.map((c, i) => (
          <circle key={i} cx={10 + c[0]} cy={10 + c[1]} r="1" fill="#d1d5db" />
        ))}
        {/* Fissure lines */}
        <line x1={10 - shape.rx + 3} y1="10" x2={10 + shape.rx - 3} y2="10" stroke="#e5e7eb" strokeWidth="0.4" />
      </svg>
      <span className="text-[10px] font-bold text-gray-600">{number}</span>
    </div>
  );
}

// ===================== STYLE 4: Stylized Modern Tooth Icons =====================
// Clean, modern look - simplified tooth shape with number inside

function ModernTooth({ number, type, selected }: { number: string; type: 'incisor' | 'canine' | 'premolar' | 'molar'; selected?: boolean }) {
  const getSVG = () => {
    switch (type) {
      case 'incisor':
        return (
          <>
            <path d="M10 1 C5 1 3 5 3 9 L3 15 C3 16 4 17 5 17 L7 17 L7 24 C7 25 8 26 9 26 L11 26 C12 26 13 25 13 24 L13 17 L15 17 C16 17 17 16 17 15 L17 9 C17 5 15 1 10 1Z" 
              fill={selected ? '#ecfdf5' : '#f9fafb'} stroke={selected ? '#10b981' : '#9ca3af'} strokeWidth="1.2" />
            <path d="M6 8 L10 5 L14 8" fill="none" stroke={selected ? '#10b981' : '#d1d5db'} strokeWidth="0.8" />
          </>
        );
      case 'canine':
        return (
          <>
            <path d="M10 1 C4 2 2 6 3 10 L4 15 C4 16 5 17 6 17 L7 17 L7 24 C7 25 8 26 9 26 L11 26 C12 26 13 25 13 24 L13 17 L14 17 C15 17 16 16 16 15 L17 10 C18 6 16 2 10 1Z" 
              fill={selected ? '#ecfdf5' : '#f9fafb'} stroke={selected ? '#10b981' : '#9ca3af'} strokeWidth="1.2" />
            <path d="M8 6 L10 2 L12 6" fill="none" stroke={selected ? '#10b981' : '#d1d5db'} strokeWidth="0.8" />
          </>
        );
      case 'premolar':
        return (
          <>
            <path d="M10 1 C4 1 2 5 2 9 L2 15 C2 16 3 17 4 17 L6 17 L6 24 C6 25 7 26 8.5 26 L11.5 26 C13 26 14 25 14 24 L14 17 L16 17 C17 17 18 16 18 15 L18 9 C18 5 16 1 10 1Z" 
              fill={selected ? '#ecfdf5' : '#f9fafb'} stroke={selected ? '#10b981' : '#9ca3af'} strokeWidth="1.2" />
            <line x1="10" y1="1" x2="10" y2="9" stroke={selected ? '#10b981' : '#d1d5db'} strokeWidth="0.6" />
            <path d="M5 7 L10 4 L15 7" fill="none" stroke={selected ? '#10b981' : '#d1d5db'} strokeWidth="0.8" />
          </>
        );
      case 'molar':
        return (
          <>
            <path d="M10 1 C3 1 1 5 1 9 L1 15 C1 16 2 17 3 17 L5 17 L5 24 C5 25 6 26 7.5 26 L12.5 26 C14 26 15 25 15 24 L15 17 L17 17 C18 17 19 16 19 15 L19 9 C19 5 17 1 10 1Z" 
              fill={selected ? '#ecfdf5' : '#f9fafb'} stroke={selected ? '#10b981' : '#9ca3af'} strokeWidth="1.2" />
            <line x1="7" y1="1" x2="7" y2="9" stroke={selected ? '#10b981' : '#d1d5db'} strokeWidth="0.5" />
            <line x1="10" y1="1" x2="10" y2="9" stroke={selected ? '#10b981' : '#d1d5db'} strokeWidth="0.5" />
            <line x1="13" y1="1" x2="13" y2="9" stroke={selected ? '#10b981' : '#d1d5db'} strokeWidth="0.5" />
          </>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="20" height="28" viewBox="0 0 20 28">
        {getSVG()}
        <text x="10" y="14" textAnchor="middle" fontSize="6" fontWeight="bold" fill={selected ? '#059669' : '#374151'}>{number}</text>
      </svg>
    </div>
  );
}

// Tooth type mapping for universal numbering
function getToothType(num: string): 'incisor' | 'canine' | 'premolar' | 'molar' {
  const n = parseInt(num);
  if (isNaN(n)) return 'incisor'; // temporary teeth fallback
  const pos = ((n - 1) % 8) + 1;
  if (pos <= 2) return 'molar';      // 3rd & 2nd molar
  if (pos === 3) return 'molar';      // 1st molar
  if (pos <= 5) return 'premolar';    // 2nd & 1st premolar
  if (pos === 6) return 'canine';     // canine
  return 'incisor';                    // lateral & central incisor
}

function getTempToothType(letter: string): 'incisor' | 'canine' | 'molar' {
  const pos = letter.charCodeAt(0);
  if (pos <= 69 || pos === 74 || pos >= 80) { // A-E, J, P-T
    if (letter === 'C' || letter === 'H' || letter === 'M' || letter === 'R') return 'canine';
    if (['A','B','I','J','K','L','S','T'].includes(letter)) return 'molar';
    return 'incisor';
  }
  if (letter === 'C' || letter === 'H' || letter === 'M' || letter === 'R') return 'canine';
  return 'incisor';
}

const upperRightPerm = ['1','2','3','4','5','6','7','8'];
const upperLeftPerm = ['9','10','11','12','13','14','15','16'];
const lowerLeftPerm = ['17','18','19','20','21','22','23','24'];
const lowerRightPerm = ['25','26','27','28','29','30','31','32'];

const permNames: Record<string, string> = {
  '1':'3rd Molar','2':'2nd Molar','3':'1st Molar','4':'2nd Premolar',
  '5':'1st Premolar','6':'Canine','7':'Lateral Incisor','8':'Central Incisor',
  '9':'Central Incisor','10':'Lateral Incisor','11':'Canine','12':'1st Premolar',
  '13':'2nd Premolar','14':'1st Molar','15':'2nd Molar','16':'3rd Molar',
  '17':'3rd Molar','18':'2nd Molar','19':'1st Molar','20':'2nd Premolar',
  '21':'1st Premolar','22':'Canine','23':'Lateral Incisor','24':'Central Incisor',
  '25':'Central Incisor','26':'Lateral Incisor','27':'Canine','28':'1st Premolar',
  '29':'2nd Premolar','30':'1st Molar','31':'2nd Molar','32':'3rd Molar',
};

export default function ToothFiguresDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Tooth Figure Styles - Preview</h1>
        <p className="text-gray-500 mt-2">Choose the tooth figure style you like. Each style shows the same permanent teeth chart.</p>
      </div>

      {/* Style 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">1</span>
            Anatomical Outlines
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">Realistic tooth outlines with anatomical root/crown separation. Clean clinical look with distinct shapes for incisors, canines, premolars, and molars.</p>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-center text-gray-400 mb-3 uppercase tracking-wider">Upper Jaw</div>
            <div className="flex justify-center gap-1">
              {upperRightPerm.map(n => <AnatomicalTooth key={n} number={n} type={getToothType(n)} />)}
              <div className="w-2 flex items-center justify-center"><div className="w-px h-8 bg-gray-300" /></div>
              {upperLeftPerm.map(n => <AnatomicalTooth key={n} number={n} type={getToothType(n)} />)}
            </div>
            <div className="border-t-2 border-dashed border-gray-200 my-3" />
            <div className="text-xs text-center text-gray-400 mb-3 uppercase tracking-wider">Lower Jaw</div>
            <div className="flex justify-center gap-1">
              {lowerLeftPerm.map(n => <AnatomicalTooth key={n} number={n} type={getToothType(n)} />)}
              <div className="w-2 flex items-center justify-center"><div className="w-px h-8 bg-gray-300" /></div>
              {lowerRightPerm.map(n => <AnatomicalTooth key={n} number={n} type={getToothType(n)} />)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">2</span>
            Filled Crown + Root
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">Tooth shapes with colored crowns (different colors per type) and visible roots. The CEJ (cementoenamel junction) line separates crown from root. Most realistic dental chart style.</p>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-center text-gray-400 mb-3 uppercase tracking-wider">Upper Jaw</div>
            <div className="flex justify-center gap-1">
              {upperRightPerm.map(n => <FilledTooth key={n} number={n} type={getToothType(n)} />)}
              <div className="w-2 flex items-center justify-center"><div className="w-px h-8 bg-gray-300" /></div>
              {upperLeftPerm.map(n => <FilledTooth key={n} number={n} type={getToothType(n)} />)}
            </div>
            <div className="border-t-2 border-dashed border-gray-200 my-3" />
            <div className="text-xs text-center text-gray-400 mb-3 uppercase tracking-wider">Lower Jaw</div>
            <div className="flex justify-center gap-1">
              {lowerLeftPerm.map(n => <FilledTooth key={n} number={n} type={getToothType(n)} />)}
              <div className="w-2 flex items-center justify-center"><div className="w-px h-8 bg-gray-300" /></div>
              {lowerRightPerm.map(n => <FilledTooth key={n} number={n} type={getToothType(n)} />)}
            </div>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Incisors</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Canines</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-pink-100 border border-pink-200" /> Premolars</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Molars</span>
          </div>
        </CardContent>
      </Card>

      {/* Style 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">3</span>
            Top-Down (Occlusal) View
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">Shows the biting surface from above with cusps marked as dots. Compact layout, great for marking procedures on specific surfaces. Common in pediatric dentistry charts.</p>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-center text-gray-400 mb-3 uppercase tracking-wider">Upper Jaw</div>
            <div className="flex justify-center gap-1">
              {upperRightPerm.map(n => <OcclusalTooth key={n} number={n} type={getToothType(n)} />)}
              <div className="w-2 flex items-center justify-center"><div className="w-px h-4 bg-gray-300" /></div>
              {upperLeftPerm.map(n => <OcclusalTooth key={n} number={n} type={getToothType(n)} />)}
            </div>
            <div className="border-t-2 border-dashed border-gray-200 my-3" />
            <div className="text-xs text-center text-gray-400 mb-3 uppercase tracking-wider">Lower Jaw</div>
            <div className="flex justify-center gap-1">
              {lowerLeftPerm.map(n => <OcclusalTooth key={n} number={n} type={getToothType(n)} />)}
              <div className="w-2 flex items-center justify-center"><div className="w-px h-4 bg-gray-300" /></div>
              {lowerRightPerm.map(n => <OcclusalTooth key={n} number={n} type={getToothType(n)} />)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style 4 */}
      <Card className="border-emerald-200 ring-2 ring-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">4</span>
            Stylized Modern (Recommended)
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">RECOMMENDED</span>
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">Clean modern design with the tooth number inside the crown area. Distinct shapes per tooth type with anatomical features (cusps, fissures). Shows selected state with emerald highlight. Best for interactive use.</p>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-center text-gray-400 mb-3 uppercase tracking-wider">Upper Jaw</div>
            <div className="flex justify-center gap-0.5">
              {upperRightPerm.map(n => <ModernTooth key={n} number={n} type={getToothType(n)} selected={['3','14','8'].includes(n)} />)}
              <div className="w-2 flex items-center justify-center"><div className="w-px h-8 bg-gray-300" /></div>
              {upperLeftPerm.map(n => <ModernTooth key={n} number={n} type={getToothType(n)} selected={['9','11'].includes(n)} />)}
            </div>
            <div className="border-t-2 border-dashed border-gray-200 my-3" />
            <div className="text-xs text-center text-gray-400 mb-3 uppercase tracking-wider">Lower Jaw</div>
            <div className="flex justify-center gap-0.5">
              {lowerLeftPerm.map(n => <ModernTooth key={n} number={n} type={getToothType(n)} selected={['22','24'].includes(n)} />)}
              <div className="w-2 flex items-center justify-center"><div className="w-px h-8 bg-gray-300" /></div>
              {lowerRightPerm.map(n => <ModernTooth key={n} number={n} type={getToothType(n)} selected={['30'].includes(n)} />)}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Teeth #3, 8, 9, 11, 14, 22, 24, 30 shown as selected (green) — same as your chart will look when a tooth is clicked</p>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500 pb-8">
        <p>Tell me which style number (1, 2, 3, or 4) you prefer and I&apos;ll apply it to your dental chart!</p>
      </div>
    </div>
  );
}
