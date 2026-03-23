const fs = require('fs');

let content = fs.readFileSync('app/dashboard/page.tsx', 'utf8');

// Header modifications
content = content.replace(
  /<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">/,
  '<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">'
);

content = content.replace(
  /<h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink mb-2">/,
  '<h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-ink mb-1 sm:mb-2">'
);

content = content.replace(
  /<p className="text-ink-sub text-base">/,
  '<p className="text-ink-sub text-sm sm:text-base">'
);

content = content.replace(
  /className="inline-flex items-center justify-center gap-2 bg-brand text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-brand-dark transition-all shadow-sm hover:shadow-md shrink-0"/,
  'className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand text-white px-7 py-4 sm:py-3.5 rounded-full text-base sm:text-sm font-medium hover:bg-brand-dark transition-all shadow-sm hover:shadow-md shrink-0"'
);

content = content.replace(
  /<Search className="w-4 h-4" \/> Find a Pro/,
  '<Search className="w-5 h-5 sm:w-4 sm:h-4" /> Find a Pro'
);

// Quotes Banner
content = content.replace(
  /bg-brand text-white rounded-\[24px\] p-6 sm:p-8 mb-10 shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6/,
  'bg-brand text-white rounded-2xl sm:rounded-[24px] p-5 sm:p-8 mb-8 sm:mb-10 shadow-md sm:shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6'
);

// My Jobs
content = content.replace(
  /<div className="lg:col-span-2 space-y-10">/,
  '<div className="lg:col-span-2 space-y-8 sm:space-y-10">'
);

content = content.replace(
  /className={`bg-white rounded-\[24px\] p-6 sm:p-8 transition-all duration-200 \${/,
  'className={`bg-white rounded-2xl sm:rounded-[24px] p-5 sm:p-8 transition-all duration-200 ${'
);

content = content.replace(
  /<div className="flex items-start justify-between gap-4 mb-6">/,
  '<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">'
);

// Status Badge
content = content.replace(
  /<StatusBadge status=\{req\.status\} \/>/,
  '<div className="self-start sm:self-auto"><StatusBadge status={req.status} /></div>'
);

// Job Stepper
content = content.replace(
  /<div className="py-4 my-4 border-y border-border-dim">/,
  '<div className="py-3 sm:py-4 my-3 sm:my-4 border-y border-border-dim">'
);

// Top Quote
content = content.replace(
  /<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-surface-alt rounded-2xl p-4 border border-border-dim">/,
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 bg-surface-alt rounded-xl sm:rounded-2xl p-4 border border-border-dim">'
);

// Job Action Button
content = content.replace(
  /<Link href=\{`\/requests\/\$\{req\.id\}`\} className=\{`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all \$\{/,
  '<Link href={`/requests/${req.id}`} className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-full text-sm font-medium transition-all ${'
);

// Browse Services
content = content.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">/,
  '<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">'
);

content = content.replace(
  /className="bg-white border border-border-dim shadow-sm rounded-\[20px\] p-6 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-brand\/30 hover:-translate-y-1 transition-all group h-full"/,
  'className="bg-white border border-border-dim shadow-sm rounded-2xl sm:rounded-[20px] p-4 sm:p-6 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-brand/30 hover:-translate-y-1 transition-all group h-full"'
);

// Recommended Pros
content = content.replace(
  /<div className="bg-white border border-border-dim shadow-sm rounded-\[24px\] p-6 sm:p-8">/,
  '<div className="bg-white border border-border-dim shadow-sm rounded-2xl sm:rounded-[24px] p-5 sm:p-8">'
);

fs.writeFileSync('app/dashboard/page.tsx', content, 'utf8');
