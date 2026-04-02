export type Locale = 'en' | 'lt';

export interface Dictionary {
  // Nav
  nav: {
    bookAPro: string;
    logIn: string;
    signUp: string;
    home: string;
    findPros: string;
    dashboard: string;
    myAccount: string;
    messages: string;
    logOut: string;
  };

  // Homepage hero
  hero: {
    eyebrow: string;
    headline: string;
    headlineHighlight: string;
    subheadline: string;
    searchPlaceholder: string;
    addressPlaceholder: string;
    search: string;
    popular: string;
    markUrgent: string;
    urgent: string;
    verified: string;
    professionalsInVilnius: string;
    topRated: string;
  };

  // Categories
  categories: {
    plumber: string;
    electrician: string;
    cleaning: string;
    handyman: string;
    movingHelp: string;
    furnitureAssembly: string;
  };

  categoryDescs: {
    plumber: string;
    electrician: string;
    cleaning: string;
    handyman: string;
    movingHelp: string;
    furnitureAssembly: string;
  };

  // Services section
  services: {
    label: string;
    title: string;
    subtitle: string;
    viewAll: string;
    bookNow: string;
    explore: string;
  };

  // How it works
  howItWorks: {
    label: string;
    title: string;
    subtitle: string;
    step: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };

  // Meet our pros
  meetPros: {
    label: string;
    title: string;
    subtitle: string;
    viewAll: string;
    jobs: string;
    reviews: string;
    viewProfile: string;
    responseTime: string;
  };

  // Testimonials
  testimonials: {
    label: string;
    title: string;
  };

  // Trust section
  trust: {
    title: string;
    verifiedTitle: string;
    verifiedDesc: string;
    transparentTitle: string;
    transparentDesc: string;
    secureTitle: string;
    secureDesc: string;
  };

  // Final CTA
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };

  // Footer
  footer: {
    forCustomers: string;
    browseServices: string;
    howItWorks: string;
    forProfessionals: string;
    joinAsAPro: string;
    support: string;
    contact: string;
    copyright: string;
  };

  // Recent bookings
  bookings: {
    recentBookings: string;
    pickUpWhereYouLeftOff: string;
    viewAll: string;
    professional: string;
    homeService: string;
  };

  // Common
  common: {
    loading: string;
    error: string;
    noResults: string;
    save: string;
    cancel: string;
    confirm: string;
    back: string;
    next: string;
    submit: string;
    delete: string;
    edit: string;
  };

  // Auth
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    email: string;
    password: string;
    loginButton: string;
    noAccount: string;
    signUpLink: string;
    registerTitle: string;
    registerSubtitle: string;
    name: string;
    confirmPassword: string;
    registerButton: string;
    haveAccount: string;
    loginLink: string;
    customerRole: string;
    providerRole: string;
    customerDesc: string;
    providerDesc: string;
  };

  // Browse page
  browse: {
    title: string;
    subtitle: string;
    all: string;
    topRated: string;
    mostReviewed: string;
    fastestResponse: string;
    searchPlaceholder: string;
    noProvidersFound: string;
    completedJobs: string;
  };
}
