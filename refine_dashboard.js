const fs = require('fs');

const file = 'app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Sidebar and Topbar styling (make them blend into the canvas)
content = content.replace(/<aside className="w-16 lg:w-56 bg-white border-r border-border-dim/g, '<aside className="w-16 lg:w-56 bg-canvas border-r border-border-dim/50');
content = content.replace(/<header className="bg-white\/90 backdrop-blur-md border-b border-border-dim/g, '<header className="bg-canvas/90 backdrop-blur-md border-b border-border-dim/50');

// 2. Sidebar active link
content = content.replace(/bg-surface-alt text-ink/g, 'bg-white shadow-sm text-brand');

// 3. Remove Quick Post pills entirely
const quickPostRegex = /\{\/\* ── Quick-job shortcuts ───────────────────────── \*\/\}\s*<div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8" style=\{\{ scrollbarWidth: 'none' \}\}>\s*<span className="text-\[10px\] font-bold uppercase tracking-widest text-ink-dim shrink-0 pr-2">Quick post:<\/span>[\s\S]*?<\/div>/;
content = content.replace(quickPostRegex, '');

// 4. Refine Header
content = content.replace(/<h1 className="text-3xl font-bold tracking-tight text-ink">Hello, \{firstName\}<\/h1>\s*<p className="text-ink-sub mt-1\.5 text-base">\{heroSubtitle\}<\/p>/, `<h1 className="text-3xl font-bold tracking-tight text-ink mb-2">Welcome back, {firstName}</h1>
                <p className="text-ink-sub text-base">Here's what's happening with your home projects today.</p>`);

// 5. Refine Empty State
const emptyStateRegex = /<div className="bg-white rounded-panel border border-dashed border-border p-12 text-center">[\s\S]*?<\/div>/;
const newEmptyState = `<div className="bg-white rounded-panel border border-border-dim p-16 text-center shadow-sm">
                      <div className="w-20 h-20 bg-brand-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Inbox className="w-10 h-10 text-brand" />
                      </div>
                      <h3 className="text-2xl font-bold text-ink mb-3">No active jobs</h3>
                      <p className="text-base text-ink-sub mb-8 max-w-md mx-auto leading-relaxed">
                        Ready to tackle your next project? Describe what you need done and get quotes from verified Vilnius professionals.
                      </p>
                      <Link href="/requests/new" className="inline-flex items-center justify-center gap-2 bg-brand text-white px-8 py-4 rounded-card text-sm font-bold hover:bg-brand-dark transition-all shadow-card hover:shadow-elevated">
                        <Plus className="w-5 h-5" /> Post Your First Job
                      </Link>
                    </div>`;
content = content.replace(emptyStateRegex, newEmptyState);

// 6. Remove "Need something done?" card from right rail
const needSomethingDoneRegex = /\{\/\* Post a Job — minimal \*\/\}\s*<div className="bg-white border border-border-dim shadow-card rounded-panel p-6">\s*<p className="font-bold text-base mb-4 text-ink">Need something done\?<\/p>\s*<Link href="\/requests\/new" className="w-full flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-card text-sm font-bold hover:bg-brand-dark transition-all shadow-card hover:shadow-elevated">\s*<Plus className="w-4 h-4" \/> Post a Job\s*<\/Link>\s*<\/div>/;
content = content.replace(needSomethingDoneRegex, '');

// 7. Refine Browse Services cards
content = content.replace(/className="bg-white border border-border-dim shadow-sm rounded-panel p-4 flex flex-col items-center gap-2 text-center hover:shadow-elevated hover:border-brand hover:-translate-y-0.5 transition-all group"/g, 'className="bg-white border border-transparent shadow-sm rounded-panel p-5 flex flex-col items-center gap-3 text-center hover:shadow-elevated hover:border-brand-muted hover:-translate-y-1 transition-all group"');
content = content.replace(/<span className="text-2xl">\{emoji\}<\/span>/g, '<span className="text-3xl mb-1">{emoji}</span>');
content = content.replace(/<span className="text-xs font-semibold text-ink-sub group-hover:text-brand transition-colors leading-tight">\{label\}<\/span>/g, '<span className="text-sm font-bold text-ink-sub group-hover:text-brand transition-colors leading-tight">{label}</span>');

fs.writeFileSync(file, content, 'utf8');
console.log('Dashboard refined.');
