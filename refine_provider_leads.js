const fs = require('fs');

let content = fs.readFileSync('app/provider/leads/page.tsx', 'utf8');

content = content.replace(
  /<div className="flex items-center justify-between mb-8">/,
  '<div className="flex items-center justify-between mb-6 sm:mb-8">'
);

content = content.replace(
  /<h1 className="text-3xl font-semibold tracking-tight text-ink">/,
  '<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">'
);

content = content.replace(
  /<div className="flex flex-col sm:flex-row gap-4 mb-8">/,
  '<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">'
);

content = content.replace(
  /className="w-full pl-11 pr-4 py-3 bg-white border border-border-dim rounded-2xl focus:ring-2 focus:ring-brand\/20 focus:border-brand outline-none text-sm transition-all shadow-sm"/,
  'className="w-full pl-11 pr-4 py-3.5 sm:py-3 bg-white border border-border-dim rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none text-base sm:text-sm transition-all shadow-sm"'
);

// Lead card inside leads/page.tsx
content = content.replace(
  /<div className="p-5 cursor-pointer"/g,
  '<div className="p-4 sm:p-5 cursor-pointer"'
);

content = content.replace(
  /<div className="flex items-start gap-4">/g,
  '<div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">'
);

content = content.replace(
  /<div className="flex flex-col items-end gap-2 shrink-0">/g,
  '<div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">'
);

content = content.replace(
  /<div className="px-5 pb-5 border-t border-border-dim pt-5">/g,
  '<div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border-dim pt-4 sm:pt-5">'
);

content = content.replace(
  /<div className="grid grid-cols-2 gap-4 mb-5 text-sm">/g,
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5 text-sm">'
);

content = content.replace(
  /<div className="flex gap-3">/g,
  '<div className="flex flex-col sm:flex-row gap-3">'
);

fs.writeFileSync('app/provider/leads/page.tsx', content, 'utf8');
