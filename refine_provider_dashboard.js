const fs = require('fs');

let content = fs.readFileSync('app/provider/dashboard/page.tsx', 'utf8');

// Header modifications
content = content.replace(
  /<div className="flex items-start justify-between mb-10">/,
  '<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 sm:mb-10">'
);

content = content.replace(
  /<h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">/,
  '<h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-ink">'
);

content = content.replace(
  /className="hidden sm:flex items-center gap-2 bg-brand text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-brand-dark transition-all shadow-sm hover:shadow-md"/,
  'className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand text-white px-7 py-4 sm:py-3.5 rounded-full text-base sm:text-sm font-medium hover:bg-brand-dark transition-all shadow-sm hover:shadow-md"'
);

// Stats grid
content = content.replace(
  /<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">/,
  '<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-10">'
);

content = content.replace(
  /className="bg-white rounded-2xl border border-border-dim p-6 hover:shadow-md hover:border-brand\/30 transition-all shadow-sm relative group"/g,
  'className="bg-white rounded-2xl border border-border-dim p-4 sm:p-6 hover:shadow-md hover:border-brand/30 transition-all shadow-sm relative group"'
);

content = content.replace(
  /className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 \${color}`}/g,
  'className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 sm:mb-4 ${color}`}'
);

content = content.replace(
  /<p className="text-3xl font-semibold tracking-tight text-ink">\{value\}<\/p>/g,
  '<p className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{value}</p>'
);

// Recent Leads
content = content.replace(
  /<div className="flex items-center justify-between mb-4">/,
  '<div className="flex items-center justify-between mb-3 sm:mb-4">'
);

content = content.replace(
  /<h2 className="text-xl font-semibold text-ink">Recent Leads<\/h2>/,
  '<h2 className="text-lg sm:text-xl font-semibold text-ink">Recent Leads</h2>'
);

// Active Jobs
content = content.replace(
  /<h2 className="text-xl font-semibold text-ink">Active Jobs<\/h2>/,
  '<h2 className="text-lg sm:text-xl font-semibold text-ink">Active Jobs</h2>'
);

// LeadCard component
content = content.replace(
  /className={`rounded-2xl border p-5 transition-all hover:shadow-md \${/g,
  'className={`rounded-2xl border p-4 sm:p-5 transition-all hover:shadow-md ${'
);

content = content.replace(
  /<div className="flex items-start justify-between gap-4">/g,
  '<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">'
);

content = content.replace(
  /className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shadow-sm hover:shadow-md \${/g,
  'className={`w-full sm:w-auto shrink-0 px-5 py-3 sm:py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shadow-sm hover:shadow-md text-center ${'
);

fs.writeFileSync('app/provider/dashboard/page.tsx', content, 'utf8');
