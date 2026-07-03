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
    popularBadge: string;
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
    verified: string;
    profile: string;
    backToDashboard: string;
    networkError: string;
    date: string;
    time: string;
    address: string;
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

  // Hero "Your project / Your Way" card
  heroCard: {
    heading: string;
    headingHighlight: string;
    desc: string;
    findAProTitle: string;
    findAProDesc: string;
    postRequestTitle: string;
    postRequestDesc: string;
    urgentTitle: string;
    urgentDesc: string;
    priorityBadge: string;
  };

  // Service cards (per-card copy)
  serviceCards: {
    plumbing:   { tag: string; title: string; desc: string; trust: string };
    electrical: { tag: string; title: string; desc: string; trust: string };
    cleaning:   { tag: string; title: string; desc: string; trust: string };
    repairs:    { tag: string; title: string; desc: string; trust: string };
    logistics:  { tag: string; title: string; desc: string; trust: string };
    assembly:   { tag: string; title: string; desc: string; trust: string };
  };

  // How It Works — hook lines
  howItWorksHooks: {
    hook1: string;
    hook2: string;
    hook3: string;
  };

  // Trust banner (carousel + Built for Trust section)
  trustBanner: {
    guaranteeTitle: string;
    guaranteeDesc: string;
    guaranteeDescLong: string;
    pricingTitle: string;
    pricingDesc: string;
    pricingDescLong: string;
    verifiedTitle: string;
    verifiedDesc: string;
    verifiedDescLong: string;
    damageTitle: string;
    damageDesc: string;
    damageDescLong: string;
    builtForTrustTitle: string;
    builtForTrustSubtitle: string;
    findAPro: string;
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

  // New-request wizard (app/requests/new)
  wizard: {
    stepService: string;
    stepType: string;
    stepDetails: string;
    stepSchedule: string;
    stepReview: string;
    timeMorning: string;
    timeMorningSub: string;
    timeAfternoon: string;
    timeAfternoonSub: string;
    timeEvening: string;
    timeEveningSub: string;
    timeFlexible: string;
    timeFlexibleSub: string;
    step1Title: string;
    step1Subtitle: string;
    step2Fallback: string;
    step2Subtitle: string;
    somethingElse: string;
    step3Title: string;
    step3Subtitle: string;
    descLabel: string;
    descPlaceholder: string;
    charHint: string;
    photosLabel: string;
    optional: string;
    addPhoto: string;
    photoAttached: string;
    photosAttached: string;
    markUrgent: string;
    urgentOn: string;
    urgentOff: string;
    step4Title: string;
    step4Subtitle: string;
    addressLabel: string;
    addressPlaceholder: string;
    dateLabel: string;
    timeLabel: string;
    budgetLabel: string;
    budgetPlaceholder: string;
    budgetHint: string;
    step5Title: string;
    step5SubtitleDirect: string;
    step5SubtitleOpen: string;
    toPrefix: string;
    toSuffix: string;
    chosenProFallback: string;
    change: string;
    reviewDescription: string;
    reviewBudget: string;
    reviewPhotos: string;
    calloutPrefix: string;
    calloutBold: string;
    stepLabel: string;
    stepOf: string;
    continueBtn: string;
    postRequest: string;
    uploadFailed: string;
    uploadFailedNetwork: string;
    submitFailed: string;
  };

  // Quote inbox (app/requests/[id])
  quoteInbox: {
    title: string;
    notFound: string;
    budgetLabel: string;
    priceRangeLabel: string;
    priceRangeHint: string;
    acceptedTitle: string;
    acceptedHint: string;
    viewBooking: string;
    waitingForPrefix: string;
    waitingForSuffix: string;
    directWaitingDesc: string;
    notHearingBack: string;
    postOpenRequest: string;
    toReachAll: string;
    prosSuffix: string;
    waitingTitle: string;
    waitingDesc: string;
    expiredSingular: string;
    expiredPlural: string;
    checkForUpdates: string;
    quoteReceived: string;
    quotesReceived: string;
    bestMatch: string;
    etaLabel: string;
    today: string;
    expired: string;
    expiresIn: string;
    hoursShort: string;
    daysShort: string;
    lowest: string;
    highest: string;
    midRange: string;
    acceptQuote: string;
    confirmTitle: string;
    confirmDeposit: string;
    othersPrefix: string;
    otherDeclinedSingular: string;
    othersDeclinedPlural: string;
    accept: string;
    updateFailed: string;
  };

  // My requests list (app/requests)
  requestsList: {
    title: string;
    newRequest: string;
    emptyTitle: string;
    emptyDesc: string;
    postARequest: string;
    active: string;
    past: string;
    serviceFallback: string;
    quoteSingular: string;
    quotesPlural: string;
  };

  // Bookings list (app/bookings)
  bookingsList: {
    title: string;
    emptyTitle: string;
    emptyDesc: string;
    browsePros: string;
    ongoing: string;
    completed: string;
    noActiveTitle: string;
    noActiveDesc: string;
  };

  // Booking detail (app/bookings/[id])
  bookingDetail: {
    stepScheduled: string;
    stepInProgress: string;
    stepCompleted: string;
    enRoute: string;
    arrivingSoon: string;
    inPrefix: string;
    day: string;
    days: string;
    hoursShort: string;
    minutesShort: string;
    minutesLong: string;
    notFound: string;
    noChat: string;
    goBack: string;
    bookingFallback: string;
    jobProgress: string;
    providerEta: string;
    canceledNotice: string;
    depositReceived: string;
    finalizing: string;
    paymentCanceled: string;
    dismiss: string;
    depositRequiredTitle: string;
    depositPayPrefix: string;
    depositBold: string;
    depositPaySuffix: string;
    payDepositBtn: string;
    priceAdjustedTitle: string;
    priceAdjustedFrom: string;
    priceAdjustedTo: string;
    priceAdjustedAction: string;
    approveBtn: string;
    dispute: string;
    priceApprovedNotice: string;
    yourPro: string;
    fastReply: string;
    call: string;
    message: string;
    callMasking: string;
    bookingDetails: string;
    paymentTitle: string;
    originalQuote: string;
    service: string;
    total: string;
    awaitingCompletion: string;
    depositConfirmedSuffix: string;
    processingNote: string;
    cancellationPolicyLabel: string;
    cancellationPolicyText: string;
    rateExperience: string;
    reviewSubmittedTitle: string;
    thanksFeedback: string;
    reviewPlaceholder: string;
    submitReview: string;
    reportIssue: string;
    issuePlaceholder: string;
    submitReport: string;
    needHelp: string;
    contactSupport: string;
    contact: string;
    issueReported: string;
    issueFailed: string;
    updateFailed: string;
    checkoutFailed: string;
    cancelTitle: string;
    cancelDesc: string;
    keepBooking: string;
    yesCancel: string;
    markComplete: string;
  };

  // Messages inbox (app/messages)
  messagesPage: {
    title: string;
    subtitle: string;
    lockedNotice: string;
    messagingLocked: string;
    loadErrorTitle: string;
    loadErrorDesc: string;
    emptyTitle: string;
    emptyDescCustomer: string;
    emptyDescProvider: string;
    noMessagesYet: string;
    noMessagesShort: string;
    youPrefix: string;
    typeMessage: string;
    sendFailed: string;
    sendFailedNetwork: string;
    selectConversation: string;
    selectConversationDesc: string;
    justNow: string;
    agoPrefix: string;
    minutesSuffix: string;
    hoursSuffix: string;
    daysSuffix: string;
  };

  // Public provider profile (app/providers/[id])
  providerProfile: {
    notFound: string;
    backToBrowse: string;
    title: string;
    instantBook: string;
    statResponse: string;
    statLanguages: string;
    statJobsDone: string;
    statResponds: string;
    statSpeaks: string;
    statJobs: string;
    qualityIndicators: string;
    jobsCompleted: string;
    responseTime: string;
    rating: string;
    idVerified: string;
    yes: string;
    no: string;
    services: string;
    priceFixed: string;
    priceFrom: string;
    priceHourly: string;
    priceOnRequest: string;
    noOfferings: string;
    typicalAvailability: string;
    off: string;
    noHours: string;
    upcomingDaysOff: string;
    timesApproximate: string;
    daySun: string;
    dayMon: string;
    dayTue: string;
    dayWed: string;
    dayThu: string;
    dayFri: string;
    daySat: string;
    reviewsTitle: string;
    noReviews: string;
    moreReviews: string;
    customerFallback: string;
    needHelp: string;
    sendRequestTo: string;
    ctaDescSuffix: string;
    noUpfrontPayment: string;
    freeCancellation: string;
    aladdinGuarantee: string;
    sendServiceRequest: string;
    thisWeek: string;
    professionalFallback: string;
    inArea: string;
  };

  // Status label vocabularies (ServiceRequest / Booking / Payment)
  statuses: {
    request: {
      NEW: string;
      CHATTING: string;
      QUOTED: string;
      ACCEPTED: string;
      DECLINED: string;
      EXPIRED: string;
    };
    booking: {
      SCHEDULED: string;
      IN_PROGRESS: string;
      COMPLETED: string;
      CANCELED: string;
    };
    payment: {
      PENDING: string;
      DEPOSIT_HELD: string;
      PROCESSING: string;
      PAID: string;
      REFUNDED: string;
      PARTIAL_REFUND: string;
    };
  };
}
