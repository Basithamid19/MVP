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
    company: string;
    about: string;
    terms: string;
    privacy: string;
    postARequest: string;
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

  // Account verification, resend, and password reset
  authFlow: {
    // Register — channel choice + phone
    verifyByLabel: string;
    channelEmail: string;
    channelSms: string;
    phone: string;
    phonePlaceholder: string;
    passwordHint: string;
    invalidEmail: string;
    invalidPhone: string;
    passwordTooShort: string;

    // Verify page
    verifyEmailTitle: string;
    verifyEmailBody: string;
    verifySmsTitle: string;
    verifySmsBody: string;
    spamNote: string;
    codeLabel: string;
    codePlaceholder: string;
    verifyButton: string;
    codeInvalid: string;
    resendButton: string;
    resendSent: string;
    resendCooldownPrefix: string;
    resendThrottled: string;
    backToLogin: string;

    // Login banners
    verifiedSuccess: string;
    verifiedFailed: string;
    unverifiedError: string;
    resendVerification: string;
    forgotPassword: string;

    // Forgot password
    forgotTitle: string;
    forgotSubtitle: string;
    forgotButton: string;
    forgotSent: string;
    forgotUnavailable: string;

    // Reset password
    resetTitle: string;
    resetSubtitle: string;
    newPassword: string;
    confirmNewPassword: string;
    resetButton: string;
    resetSuccess: string;
    resetMismatch: string;
    resetMissingToken: string;
    goToLogin: string;

    // Password visibility toggle (aria-labels)
    showPassword: string;
    hidePassword: string;

    genericError: string;
  };

  // Right-hand showcase panel on the auth screens (components/AuthShowcase)
  authShowcase: {
    loginTitle: string;
    loginSubtitle: string;
    registerCustomerTitle: string;
    registerCustomerSubtitle: string;
    registerProviderTitle: string;
    registerProviderSubtitle: string;
    verifyTitle: string;
    verifySubtitle: string;
    forgotTitle: string;
    forgotSubtitle: string;
    resetTitle: string;
    resetSubtitle: string;
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
    filters: string;
    categoriesLabel: string;
    sortByLabel: string;
    professionalFound: string;
    professionalsFound: string;
    tryDifferent: string;
    clearFilters: string;
    clearAll: string;
    showResults: string;
  };

  // Category landing page (app/category/[slug])
  categoryPage: {
    notFoundTitle: string;
    notFoundDesc: string;
    proAvailable: string;      // "{n} pro available in Vilnius" — singular
    prosAvailable: string;     // "{n} pros available in Vilnius" — plural
    prosInPrefix: string;      // "Pros in {category}"
    emptyProsDesc: string;
    postJob: string;
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
    minutesShort: string;
    hoursShort: string;
    daysShort: string;
    lowest: string;
    highest: string;
    midRange: string;
    acceptQuote: string;
    dismissQuote: string;
    confirmTitle: string;
    confirmDeposit: string;
    othersPrefix: string;
    otherDeclinedSingular: string;
    othersDeclinedPlural: string;
    accept: string;
    updateFailed: string;
    // Availability conflicts returned by POST /api/quotes (409 + errorCode).
    errBlackout: string;
    errDayUnavailable: string;
    errOutsideHours: string;
    errTimeConflict: string;
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
    past: string;
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
    heroScheduled: string;
    heroInProgress: string;
    heroCompleted: string;
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
    noMessagesShort: string;
    youPrefix: string;
    newBadge: string;
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

  // Shared chat surface (components/shared/chat-view + app/messages)
  chatView: {
    today: string;
    yesterday: string;
    roleProvider: string;
    roleCustomer: string;
    emptyTitle: string;
    emptyDesc: string;
    sharedPhoto: string;
    attachPhoto: string;
    callAction: string;
    eventTimeline: string;
    closeTimeline: string;
    eventQuoteSent: string;
    eventQuoteAccepted: string;
    eventBookingConfirmed: string;
    eventJobStarted: string;
    eventJobCompleted: string;
    eventReviewLeft: string;
    lockedTitle: string;
    lockedDesc: string;
    payNow: string;
    uploadFailed: string;
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
    statJobs: string;
    responseTime: string;
    rating: string;
    idVerified: string;
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
    quote: {
      PENDING: string;
      ACCEPTED: string;
      DECLINED: string;
      EXPIRED: string;
    };
  };

  // Provider sidebar / top bar (app/provider/layout.tsx)
  providerNav: {
    overview: string;
    work: string;
    business: string;
    account: string;
    dashboard: string;
    leads: string;
    myQuotes: string;
    jobs: string;
    messages: string;
    earnings: string;
    performance: string;
    settings: string;
    support: string;
    verification: string;
    logOut: string;
    notifications: string;
    markAllRead: string;
    markAllAsRead: string;
    moreNotifications: string;
    allCaughtUp: string;
  };

  // Mobile bottom nav (components/MobileNav.tsx) — labels not already in nav.*
  mobileNav: {
    account: string;
    jobs: string;
    stats: string;
  };

  // Provider dashboard (app/provider/dashboard/DashboardClient.tsx)
  providerDashboard: {
    loadErrorBold: string;
    loadErrorRest: string;
    hello: string;
    ctaViewPrefix: string;
    newLeadSingular: string;
    newLeadsPlural: string;
    viewLeads: string;
    browseLeads: string;
    statNewLeads: string;
    statActiveJobs: string;
    statCompleted: string;
    statEarnings: string;
    newTodaySuffix: string;
    noneYet: string;
    inProgressSuffix: string;
    noneScheduled: string;
    allTime: string;
    netEarned: string;
    stepAddPhoto: string;
    stepWriteBio: string;
    stepSetArea: string;
    stepChooseCategories: string;
    stepAddOfferings: string;
    freshLeadSingular: string;
    freshLeadsPlural: string;
    freshLeadMobileRest: string;
    go: string;
    completeVerificationBold: string;
    completeVerificationRest: string;
    profilePrefix: string;
    completeSuffix: string;
    nextPrefix: string;
    freshWaitingSingular: string;
    freshWaitingPlural: string;
    respondHint: string;
    respondNow: string;
    verifyBannerTitle: string;
    verifyBannerDesc: string;
    getVerified: string;
    profileBannerPrefix: string;
    nextStepPrefix: string;
    almostThere: string;
    completeProfilesAttract: string;
    completeProfileBtn: string;
    urgentLeadSingular: string;
    urgentLeadsPlural: string;
    recentLeads: string;
    viewAll: string;
    activeJobs: string;
    emptyLeadsTitle: string;
    emptyLeadsDesc: string;
    noLeadsTitle: string;
    noLeadsDesc: string;
    completeYourProfile: string;
    emptyJobsTitle: string;
    emptyJobsDesc: string;
    browseAvailableLeads: string;
    jobFallback: string;
    quickActions: string;
    manageSettings: string;
    viewEarnings: string;
    completeVerification: string;
    manageVerification: string;
    yourRating: string;
    completedJobsSuffix: string;
    fullPerformance: string;
    jobsDoneSuffix: string;
    viewFullPerformance: string;
    urgent: string;
    respond: string;
  };

  // Lead inbox (app/provider/leads)
  leadsPage: {
    title: string;
    openRequestSingular: string;
    openRequestsPlural: string;
    urgentCountSuffix: string;
    setCategoriesTitle: string;
    setCategoriesDesc: string;
    searchPlaceholder: string;
    filterAll: string;
    filterUrgent: string;
    filterNew: string;
    emptyNoLeadsTitle: string;
    emptyNoMatchesTitle: string;
    emptyNoLeadsDesc: string;
    emptyNoMatchesDesc: string;
    checkProfile: string;
    badgeDirect: string;
    badgeUrgent: string;
    badgeNew: string;
    respondFast: string;
    notSpecified: string;
    sendQuote: string;
    pass: string;
    hoursShortSuffix: string;
  };

  // My Quotes (app/provider/quotes)
  myQuotes: {
    title: string;
    pendingSuffix: string;
    totalSuffix: string;
    emptyTitle: string;
    emptyDesc: string;
    sectionPending: string;
    sectionHistory: string;
    sentPrefix: string;
    viewJob: string;
  };

  // Jobs list (app/provider/jobs)
  jobsPage: {
    title: string;
    filterActive: string;
    filterCompleted: string;
    filterAll: string;
    emptyActiveTitle: string;
    emptyActiveDesc: string;
    emptyCompletedTitle: string;
    emptyCompletedDesc: string;
    emptyAllTitle: string;
    emptyAllDesc: string;
    yourShare: string;
  };

  // Job detail (app/provider/jobs/[bookingId])
  jobDetail: {
    deviceOnlyNotice: string;
    backToJobs: string;
    idLabel: string;
    notFound: string;
    depositPaid: string;
    depositPending: string;
    earnings: string;
    scheduled: string;
    duration: string;
    stripeTitle: string;
    customer: string;
    navigate: string;
    jobDetails: string;
    yourEarnings: string;
    estimatedHours: string;
    jobNotes: string;
    checklistTitle: string;
    checkConfirmAddress: string;
    checkInspectScope: string;
    checkBeforePhotos: string;
    checkCompleteJob: string;
    checkCleanUp: string;
    checkAfterPhotos: string;
    checkConfirmCompletion: string;
    documentation: string;
    photoSingular: string;
    photosPlural: string;
    thisDeviceOnly: string;
    addPhotos: string;
    addPhotosDesc: string;
    add: string;
    reportIssueDesc: string;
    startJob: string;
    awaitingDeposit: string;
    updateFailed: string;
  };

  // Earnings & payouts (app/provider/earnings)
  earningsPage: {
    title: string;
    taxExport: string;
    netEarned: string;
    jobsSuffix: string;
    grossSuffix: string;
    platformFeeShort: string;
    stillProcessing: string;
    pendingLabel: string;
    noPendingEarnings: string;
    totalEarned: string;
    activeJobsSuffix: string;
    settled: string;
    processingSuffix: string;
    feeLabel: string;
    totalSuffix: string;
    monthlyEarnings: string;
    lastPrefix: string;
    monthsSuffix: string;
    firstMonth: string;
    tabOverview: string;
    tabHistory: string;
    tabPayouts: string;
    earningsBreakdown: string;
    grossRevenue: string;
    platformFee: string;
    netEarnings: string;
    payoutNote: string;
    noCompletedTitle: string;
    noCompletedDesc: string;
    paidOut: string;
    processing: string;
    payoutsActive: string;
    connectedViaStripe: string;
    rowMethod: string;
    rowMethodValue: string;
    rowWhen: string;
    rowWhenValue: string;
    rowProcessing: string;
    rowProcessingValue: string;
    rowPlatformFee: string;
    managePayouts: string;
    openingStripe: string;
    setupTitle: string;
    payoutSetupDesc: string;
    setUpPayouts: string;
    setupFailed: string;
  };

  // Provider settings hub (app/provider/settings — hub only)
  providerSettingsHub: {
    headerAccount: string;
    notVerified: string;
    loadErrorTitle: string;
    loadErrorDesc: string;
    retry: string;
    uploadFailedPrefix: string;
    uploadFailedSuffix: string;
    sectionSetup: string;
    sectionActivity: string;
    sectionSupport: string;
    sectionAccount: string;
    rowProfileSub: string;
    rowServices: string;
    rowServicesSub: string;
    rowAvailability: string;
    rowAvailabilitySub: string;
    invoices: string;
    invoiceSingular: string;
    invoicesPlural: string;
    noInvoices: string;
    invoicePending: string;
    totalEarnedRow: string;
    rowReportIssueSub: string;
    helpCentre: string;
    helpCentreSub: string;
    emailUs: string;
    rowVerificationSub: string;
    rowEarningsSub: string;
  };

  // Provider onboarding wizard (app/provider/onboarding)
  onboarding: {
    stepIdentity: string;
    stepBusiness: string;
    stepCredentials: string;
    stepSelfie: string;
    identityTitle: string;
    identitySubtitle: string;
    fullLegalName: string;
    phoneNumber: string;
    nationalIdLabel: string;
    optionalEncrypted: string;
    idPlaceholder: string;
    privacyBold: string;
    privacyNote: string;
    businessTitle: string;
    businessSubtitle: string;
    btSoleTrader: string;
    btSoleTraderDesc: string;
    btCompany: string;
    btCompanyDesc: string;
    btFreelancer: string;
    btFreelancerDesc: string;
    companyName: string;
    companyPlaceholder: string;
    vatNumber: string;
    docsTitle: string;
    docsSubtitle: string;
    docIdCard: string;
    docPassport: string;
    docCertificate: string;
    docInsurance: string;
    optionalTrust: string;
    uploadedCheck: string;
    uploading: string;
    uploadFile: string;
    selfieTitle: string;
    selfieSubtitle: string;
    lookingGood: string;
    reviewIn24h: string;
    takeSelfie: string;
    orTapUpload: string;
    tipsTitle: string;
    tip1: string;
    tip2: string;
    tip3: string;
    doneTitle: string;
    doneDescPrefix: string;
    done24h: string;
    doneDescSuffix: string;
    reviewDocsUploaded: string;
    goToDashboard: string;
    submitForReview: string;
    errNoDocs: string;
    errSubmitFailed: string;
  };

  // Verification status page (app/provider/verification)
  verificationPage: {
    title: string;
    subtitle: string;
    tierBasic: string;
    tierBasicDesc: string;
    tierIdVerified: string;
    tierIdVerifiedDesc: string;
    tierTradeVerified: string;
    tierTradeVerifiedDesc: string;
    tierEnhanced: string;
    tierEnhancedDesc: string;
    statPending: string;
    statApproved: string;
    statRejected: string;
    submittedDocuments: string;
    docId: string;
    docCertificate: string;
    docInsurance: string;
    docSelfie: string;
    stUnderReview: string;
    stApproved: string;
    stRejected: string;
    submittedPrefix: string;
    emptyTitle: string;
    emptyDesc: string;
    startVerification: string;
    rejectedTitle: string;
    rejectedDesc: string;
    resubmit: string;
    pendingTitle: string;
    pendingDesc: string;
  };

  // Quote builder (app/provider/quote/[requestId])
  quoteBuilder: {
    title: string;
    pricing: string;
    basePrice: string;
    hoursPlaceholder: string;
    optionalLineItems: string;
    itemPlaceholder: string;
    addLineItem: string;
    totalQuote: string;
    notesTerms: string;
    messageToCustomer: string;
    messagePlaceholder: string;
    materialsNoteLabel: string;
    materialsPlaceholder: string;
    exclusionsLabel: string;
    exclusionsPlaceholder: string;
    quoteExpiry: string;
    daysShortBtn: string;
    expiresPrefix: string;
    sendFailed: string;
    sentTitle: string;
    sentDescPrefix: string;
    sentDescSuffix: string;
    backToLeads: string;
  };
}
