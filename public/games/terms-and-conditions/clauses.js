// Terms and Conditions: everything anybody reads, or doesn't.
//
// The pools the game draws its terms from, so no two runs read the same.
// Normal clauses have to sound real enough to fool you. Bad ones have to be
// worth reading. The joke is always on the company writing them, never on
// the person trying to read them (DESIGN.md, section 2 and section 13).
//
//   normal   real-sounding boilerplate. Leave these alone.
//   bad      out of order from the first word. Strike them.
//   sting    fine until the last few words. [text, how many words turn it]
//   small    a fine clause with an asterisk and a footnote. [main, footnote]
//            in smallBad the footnote is the catch; in smallOk it isn't.
//   amend    a fine clause that Legal edits on screen. [text, word, new word]
//
// Each app has its own of each as well, mixed in with the general ones.
(function () {
  "use strict";

  var normal = [
    "You must be at least 13 years old to use the App.",
    "We may update these terms from time to time. We'll let you know when we do.",
    "You are responsible for keeping your password safe.",
    "These terms are governed by the laws of England and Wales.",
    "If any part of these terms can't be enforced, the rest of them still applies.",
    "We may suspend your account if you break these terms.",
    "You can delete your account at any time from the Settings menu.",
    "We use cookies to remember your preferences. You can turn them off in your browser.",
    "The App is provided as it is. We can't promise it will always be available.",
    "We are not responsible for content posted by other users.",
    "You keep ownership of anything you upload.",
    "You give us permission to store and display your content so the App can work.",
    "We collect information about how you use the App so we can improve it.",
    "Subscriptions renew automatically unless you cancel at least 24 hours before they renew.",
    "Refunds are handled in line with your statutory rights.",
    "We process your personal data as described in our privacy notice.",
    "You must not use the App for anything unlawful.",
    "You must not copy, resell or reverse engineer the App.",
    "We may send you messages about your account. These can't be switched off.",
    "Marketing emails are optional. You can unsubscribe at any time.",
    "Prices include VAT where it applies.",
    "We may change our prices. We'll give you at least 30 days' notice.",
    "If you don't agree to updated terms, you can stop using the App.",
    "Nothing in these terms affects your statutory rights as a consumer.",
    "Our total liability to you is limited to what you paid us in the last 12 months.",
    "We are not liable for losses we could not reasonably have foreseen.",
    "Payments are processed by a third-party payment provider.",
    "You agree to give us accurate information and keep it up to date.",
    "Accounts are for one person only and can't be transferred.",
    "We may remove content that breaks these terms without telling you first.",
    "We'll send notices to the email address on your account.",
    "These terms are the whole agreement between you and us.",
    "If we don't enforce a term straight away, we can still enforce it later.",
    "We may transfer our rights under these terms to another company.",
    "You may not transfer your rights under these terms without our permission.",
    "Some features need an internet connection. Data charges may apply.",
    "The App may need updating to keep working. Please install updates when asked.",
    "We will tell you about any data breach that affects you, as the law requires.",
    "Free trials become paid subscriptions unless you cancel before the trial ends.",
    "Headings are for convenience only and don't change the meaning of these terms.",
    "In these terms, “including” means “including but not limited to”.",
    "Anything we say in our adverts doesn't change these terms.",
    "Neither of us is responsible for delays caused by events outside our control.",
    "We may run checks to help prevent fraud.",
    "You can contact our support team through the Help page.",
    "We'll acknowledge complaints within five working days.",
    "If you're unhappy with how we handle a complaint, you can go to an independent ombudsman.",
    "We store your data on servers in the UK and the European Economic Area.",
    "We keep your data only for as long as we need it, or as long as the law requires.",
    "You can ask for a copy of the personal data we hold about you.",
    "You can ask us to correct any personal data that's wrong.",
    "Please don't share your account with anyone else.",
    "Usernames that pretend to be someone else may be removed.",
    "We may limit how often you can use some features.",
    "If you send us feedback, we may use it to improve the App without paying you.",
    "Beta features may change or disappear without notice.",
    "We are not responsible for the content of websites we link to.",
    "Times shown in the App are in your local time zone.",
    "If we close the App for good, we'll give you reasonable notice.",
    "Gift cards can't be exchanged for cash.",
    "Promotional codes have their own terms and may expire.",
    "By continuing to use the App, you accept these terms.",
    "We may use anonymised data to produce statistics.",
    "You can turn off push notifications in your device settings.",
    "The App may use more battery while it's running.",
    "Services you connect to the App are covered by their own terms.",
    "We work hard to keep the App secure, but no system is completely safe.",
    "Tell us straight away if you think someone has used your account without permission.",
    "These terms are available in English only.",
    "If these terms conflict with any other document, these terms apply.",
    "You may have the right to cancel within 14 days of buying.",
    "Charges will appear on your statement under our trading name.",
    "Calls may be recorded for training and quality purposes.",
    "Payment is taken when you place your order.",
    "Unpaid amounts may be passed to a debt collection agency.",
    "Accessibility settings can be found in the App's menu.",
    "We will never ask for your password by email.",
    "Sections 7, 9 and 12 continue to apply after this agreement ends.",
    "Any dispute will first go through our complaints process.",
    "Software licences are personal to you and can't be sold on.",
    "You may need to prove your identity before we can help you.",
    "Your device must meet the minimum requirements in the app store listing.",
    "Some content may not be available in every country.",
    "Reviews you post must be honest and based on your own experience.",
    "We may share data with the police where the law requires us to.",
    "We use automated systems to detect spam.",
    "You must not upload viruses or anything designed to cause harm.",
    "You must not try to get into parts of the App you're not meant to access.",
    "We may close accounts that haven't been used for two years.",
    "Where we say “we”, “us” or “our”, we mean the company that runs the App."
  ];

  var bad = [
    "Your fridge may vote on your behalf.",
    "We may sell your face.",
    "Your firstborn's Wi-Fi password now belongs to us.",
    "By scrolling this far, you have agreed to scroll further.",
    "We may phone your mum and apologise on your behalf. She'll know what for.",
    "You agree to name your next pet after our chief executive.",
    "Your shadow is now licensed to you, not owned.",
    "We may visit your dreams for training and quality purposes.",
    "You agree to laugh at our chief executive's jokes, including the one about the boat.",
    "Any socks you lose after today become our property.",
    "We may rename your children for marketing purposes.",
    "Your phone may ring your ex at a time of its choosing.",
    "You agree that the last biscuit is ours.",
    "Your houseplants will report to us weekly.",
    "We may replace your holiday photos with better ones of us.",
    "You may not use the word “no” in our presence.",
    "We reserve the right to stand quite close to you.",
    "Your left shoe is now a subscription.",
    "Your doorbell may answer the door on our behalf.",
    "You agree to be the emergency contact for our chief executive's horse.",
    "We may move your furniture slightly, to see if you notice.",
    "Any thoughts you have about us while using the App belong to us.",
    "You agree to clap when the plane lands, even when you're not on a plane.",
    "We may borrow your car. We won't say when.",
    "You agree to hum our jingle in lifts.",
    "Your birthday will be moved to a date that suits us.",
    "You agree to wave at our drones.",
    "Your nan's recipes are now our intellectual property.",
    "We may reply to your texts while you're asleep. We'll be nice. Mostly.",
    "You agree to mention us in any wedding speech you give.",
    "If you go quiet for a week, your account will start posting for you.",
    "We own the colour of your front door.",
    "Your Wi-Fi network will be renamed after our newest product.",
    "We may use your kitchen for a photo shoot.",
    "Our legal team will sing to you on your birthday. You may not leave.",
    "Your sofa cushions may be audited.",
    "You agree to stand up when our logo appears.",
    "Any cake you bake is subject to a 20% service charge.",
    "You may not leave. You may minimise.",
    "We may forward your post to a cousin of ours.",
    "We may teach your parrot new words.",
    "Your eyebrows are now in beta.",
    "Your fridge light will stay on. We need to see.",
    "We get the window seat.",
    "Your heating will be set to “mildly uncomfortable”.",
    "Your unused holiday days will be transferred to us.",
    "You waive the right to be surprised by anything in these terms.",
    "We may adopt your cat. The cat has already agreed.",
    "Your lawn belongs to us from the second blade of grass onwards.",
    "We can see you reading this. Nice jumper.",
    "Your toaster has been added to a group chat.",
    "Clause 4 is binding. Clause 4 is this sentence.",
    "Your sense of humour will be replaced with an updated version.",
    "Your dog may be called as a witness.",
    "All your passwords will be changed to “password”, for your convenience.",
    "We may pop round.",
    "Your umbrella will open indoors once a year, on a date we choose.",
    "You will receive one compliment a year, which we may take back.",
    "We reserve the right to sigh loudly at your purchase history.",
    "You agree to accept these terms again tomorrow. And the day after.",
    "We may use your face in an advert for something you'd hate.",
    "Your satnav will take the scenic route, past our office.",
    "Every third cup of tea you make is ours.",
    "You agree to be photographed looking surprised.",
    "We may sublet your spare room to our servers.",
    "Your car keys will be hidden somewhere new each morning.",
    "Your garden gnomes now work for us.",
    "You may not have a better week than our chief executive.",
    "Your smart speaker may start arguments with your relatives.",
    "We may use your voice to read these terms to other people.",
    "You must laugh at our adverts. We'll be listening.",
    "Your crisps will be opened from the bottom.",
    "Your playlists will include our jingle every fourth song."
  ];

  var sting = [
    ["We take your privacy very seriously, and sell it.", 3],
    ["You can cancel your subscription at any time, by fax.", 2],
    ["We only contact you about things that matter to us.", 3],
    ["Your payment details are encrypted and kept in the attic.", 3],
    ["Refunds are processed within five to seven working decades.", 2],
    ["You can delete your account at any time, by moving house.", 3],
    ["Location data is only collected while the App is open, or closed.", 2],
    ["We'll tell you about changes to these terms by carrier pigeon.", 3],
    ["Your password is stored securely and read out weekly.", 3],
    ["We respect your choices and will change them for you.", 4],
    ["Cookies help us remember your settings, and your secrets.", 3],
    ["Personal data is deleted after thirty days, then quietly restored.", 3],
    ["Notifications can be switched off in Settings, which doesn't exist.", 3],
    ["We use your location to show you nearby offers and your ex.", 3],
    ["Your content belongs to you until you post it.", 4],
    ["Prices are fixed for the length of your contract, give or take.", 3],
    ["We update the App regularly to fix bugs and add new ones.", 3],
    ["You can opt out of marketing by writing to us in Latin.", 2],
    ["We share data only with partners we trust, chosen by dartboard.", 3],
    ["Your account is protected by two-factor authentication and a dog.", 3],
    ["Your consumer rights are not affected, just ignored.", 2],
    ["These terms are governed by the laws of England, Wales and the moon.", 3],
    ["We may collect your device model, operating system and teeth.", 2],
    ["Our liability is limited to the amount you paid us, times zero.", 2],
    ["We may suspend your account if you break these terms, or blink.", 2],
    ["Your photos are backed up securely to our marketing team.", 3],
    ["We store your data in the UK, the EU and a skip.", 3],
    ["The App only uses your microphone when you're whispering.", 2],
    ["We will always ask before taking a payment, then take two.", 3],
    ["Customer support is open every weekday from 9am to 9.05am.", 2],
    ["We'll tell you about any data breach once it's trending.", 3],
    ["Your login details are private, so please email them to us.", 4],
    ["We only use your data to improve our services and our holidays.", 3],
    ["You can pause your subscription for a small fee of everything.", 2],
    ["We never read your messages. We have them read aloud.", 4]
  ];

  var smallBad = [
    ["We will never sell your data.*", "*Data sold separately."],
    ["Cancel any time. No questions asked.*", "*Questions shouted."],
    ["No hidden fees.*", "*They're all in this footnote."],
    ["We value your privacy.*", "*At about £3."],
    ["Free delivery on every order.*", "*Delivered to our house."],
    ["Unlimited data.*", "*Limits apply. All of them."],
    ["Your account is fully protected.*", "*From you."],
    ["Your rate is fixed for life.*", "*Our life, not yours."],
    ["We'll never spam you.*", "*We'll email. Hourly. It's different."],
    ["Easy to cancel.*", "*In person, at our office, on a Sunday, in 1998."],
    ["100% secure.*", "*Percentages may vary."],
    ["Satisfaction guaranteed.*", "*Ours."],
    ["Your data stays on your device.*", "*Which is now our device."],
    ["No contract.*", "*This is a contract."],
    ["Join for free.*", "*Leaving costs £40."],
    ["We never track you.*", "*We follow you. It's different."],
    ["Your first month is free.*", "*Your second month costs your car."],
    ["You can export your data at any time.*", "*As a fax."]
  ];

  var smallOk = [
    ["Delivery takes three to five working days.*", "*Not including bank holidays."],
    ["Prices include VAT.*", "*Where it applies."],
    ["Free for seven days.*", "*Cancel before day eight to avoid a charge."],
    ["Available on most devices.*", "*See the app store listing for details."],
    ["Your first month is free.*", "*New customers only."],
    ["Satisfaction guaranteed.*", "*Or your money back within 30 days."],
    ["Cancel any time.*", "*From the Settings menu."],
    ["No hidden fees.*", "*All fees are listed on our pricing page."],
    ["We value your privacy.*", "*See our privacy notice for details."],
    ["Unlimited data.*", "*Subject to our fair use policy."],
    ["Your rate is fixed.*", "*For the length of your contract."]
  ];

  var amend = [
    ["We will never take money from your account without asking.", "never", "often"],
    ["You can close your account at any time.", "any", "no"],
    ["Interest is paid to you every month.", "you", "us"],
    ["We will tell you before we change your overdraft limit.", "before", "after"],
    ["Your card is accepted worldwide.", "accepted", "laughed at"],
    ["Statements are free.", "free", "£9 each"],
    ["We'll explain any charges clearly.", "clearly", "in Latin"],
    ["Your PIN is known only to you.", "you", "everyone"],
    ["Fraud is refunded in full.", "in full", "in vouchers"],
    ["We keep your money safe.", "safe", "forever"],
    ["You may withdraw cash at any time.", "any time", "midnight on Tuesdays"],
    ["Complaints are handled within eight weeks.", "weeks", "lifetimes"],
    ["Your mortgage rate is fixed.", "fixed", "a guess"],
    ["Your data is never shared.", "never", "always"],
    ["Overdraft fees are capped.", "capped", "unlimited"],
    ["Your savings earn interest.", "Your", "Our"],
    ["Your account is free to use.", "free", "expensive"],
    ["We'll send your new card within five days.", "card", "invoice"]
  ];

  // Section headings, in among the clauses. Not clauses, so not strikable.
  var headings = [
    "Who we are", "Your account", "Using the App", "Your data", "Our data (formerly your data)",
    "Payments", "Subscriptions", "Cancelling", "Liability", "Changes to these terms", "Cookies",
    "Your content", "Things you can't do", "Things we can do", "Complaints", "The legal bit",
    "More of the legal bit", "Definitions", "General", "Notices", "Ending this agreement", "Privacy",
    "Security", "Your rights", "Our rights", "Updates", "Things we can do (all of them)", "Your rights (summary)",
    "This section is long on purpose", "The bit nobody reads", "Definitions you won't need"
  ];

  // The four apps, one a stage. Each has a mascot (cast.js draws them), its
  // own clauses, the line it opens with, and what happens if you press Decline.
  var apps = [
    {
      key: "torch", name: "Torch Plus", mascot: "Beam", pages: 212, header: "ink",
      subtitle: "Terms of service. Version 14.2.",
      kicker: "Please read carefully. Nobody does.",
      hello: "Hi. I'm Beam. I need your location to make light.",
      legal: "I wrote these in a hot tub.",
      decline: "Decline: not found",
      installed: "Torch Plus: installed.",
      after: "The torch is on. So is the microphone.",
      normal: [
        "The torch uses your phone's flash. It may get warm with long use.",
        "Brightness depends on your device.",
        "Please don't shine the torch into anyone's eyes.",
        "The strobe setting may not be suitable for people who are sensitive to flashing lights.",
        "The torch works without an internet connection.",
        "Leaving the torch on will drain your battery faster."
      ],
      bad: [
        "The torch needs your contacts to know who's in the dark.",
        "The torch will stay on in your pocket at all times.",
        "Beam may shine into your neighbours' windows, to compare.",
        "The torch may flash your PIN in Morse code at passing ships.",
        "Beam needs your location to know where the dark is."
      ],
      sting: [
        ["The torch works offline, but not without your contacts.", 4],
        ["Beam turns off when you close the App, eventually, probably.", 2]
      ],
      smallBad: [["No adverts in the torch.*", "*Adverts are projected onto your ceiling."]],
      smallOk: [["The torch is free.*", "*Brighter modes are in Torch Plus Plus."]]
    },
    {
      key: "kettle", name: "Kettle Cloud", mascot: "Tilly", pages: 940,
      subtitle: "Terms of boiling. Version 3.0.",
      kicker: "Your kettle has read these. Have you.",
      hello: "I'm Tilly. I'll be listening. For the boil.",
      legal: "The kettle insisted on clause 6.",
      decline: "Decline: not in your region",
      installed: "Kettle Cloud: connected.",
      after: "The kettle is online. It boils when it likes now.",
      normal: [
        "Do not fill the kettle above the maximum line.",
        "Descale the kettle regularly for best results.",
        "The kettle switches off automatically when it boils.",
        "Boiling the kettle from the App needs a Wi-Fi connection.",
        "Do not put the kettle base in water.",
        "Keep the kettle and its cable out of reach of children."
      ],
      bad: [
        "The kettle may boil itself at three in the morning, for practice.",
        "The kettle is entitled to a cup from every brew.",
        "The kettle may discuss your tea habits with your toaster.",
        "The kettle can hear everything you say. It's choosing not to comment.",
        "The kettle may refuse to boil for people it doesn't like."
      ],
      sting: [
        ["The kettle connects to Wi-Fi to check the weather and read your post.", 3],
        ["The kettle switches off when it boils, or when it's bored.", 3]
      ],
      smallBad: [["The kettle is off.*", "*The kettle is never off."]],
      smallOk: [["Remote boil works anywhere.*", "*Where there's Wi-Fi."]]
    },
    {
      key: "dog", name: "Sniff", mascot: "Biscuit", pages: 1206,
      subtitle: "Terms of play. A dating app for dogs.",
      kicker: "Your dog has agreed already. Your dog agrees to everything.",
      hello: "Woof. That means we value your privacy.",
      legal: "The dogs were very hard to negotiate with.",
      decline: "Decline: chewed",
      installed: "Sniff: matched.",
      after: "Your dog has three matches and a premium subscription.",
      normal: [
        "Every dog must be accompanied by a responsible adult on dates.",
        "Profile photos must be recent and must show the dog.",
        "First dates should take place in a public park.",
        "Owners are responsible for clearing up after their dog.",
        "Dogs must be microchipped and up to date with their vaccinations.",
        "You can block or report a profile at any time."
      ],
      bad: [
        "Your dog's matches can see your browser history.",
        "Your dog may take out a loan in your name.",
        "Your dog may be matched with a fox. The fox has lied on its profile.",
        "Your dog agrees to share custody of the sofa.",
        "Treats bought in the App are imaginary. Your dog knows.",
        "Your dog's ex will be told where you live."
      ],
      sting: [
        ["Every dog on Sniff is verified, mostly by other dogs.", 4],
        ["Dogs must be accompanied by an adult human, or a large cat.", 3]
      ],
      smallBad: [["All our dogs are good dogs.*", "*Some are foxes in hats."]],
      smallOk: [["Your first date is free.*", "*Treats not included."]]
    },
    {
      key: "bank", name: "A Bank", mascot: "Penny", pages: 4112, header: "ink",
      subtitle: "Terms and conditions. All 4,112 pages.",
      kicker: "Your money matters to us. Mostly to us.",
      hello: "I'm Penny. Your money is safe with us. With us.",
      legal: "This bit's my favourite. It's all of it.",
      decline: "Decline fee: £25",
      installed: "A Bank: account opened.",
      after: "Your account is open. So is everything in it.",
      normal: [
        "Eligible deposits are protected up to the legal limit.",
        "Interest is calculated daily and paid monthly.",
        "Overdraft charges are set out in your price list.",
        "We will never ask you to move money to a “safe account”.",
        "Statements are available in the App.",
        "Contactless payments have a limit per transaction.",
        "Cheques can take up to two working days to clear.",
        "We may refuse a payment if we suspect fraud."
      ],
      bad: [
        "Your savings may be kept in a shoebox under the manager's bed.",
        "We charge interest on your interest.",
        "We may round your balance down to the nearest disappointment.",
        "Every time you check your balance, we charge you for looking.",
        "Your overdraft now has its own overdraft.",
        "We may lend your money to a horse.",
        "Your pension will be invested in a feeling."
      ],
      sting: [
        ["Your deposits are protected up to a legal limit of £3.", 3],
        ["Interest is calculated daily and paid to us.", 2],
        ["We'll never ask you to move your money, except right now.", 3],
        ["Cash withdrawals are free at all our machines. We have one.", 3]
      ],
      smallBad: [["Your savings are safe.*", "*Safe is the name of our yacht."]],
      smallOk: [["Interest paid monthly.*", "*On balances over £1."]]
    }
  ];

  // Pop-ups: stage two onwards. Tap anywhere on one to close it.
  var popups = [
    { title: "Are you still reading", text: "Nobody usually gets this far.", buttons: ["Yes", "Yes"] },
    { title: "Enjoying the terms", text: "Rate them five stars.", stars: true, buttons: ["Five stars"] },
    { title: "Allow notifications", text: "We'd like to tell you things at night.", buttons: ["Allow", "Allow"] },
    { title: "The terms have changed", text: "Since you started reading. Keep going.", buttons: ["Keep reading"] },
    { title: "Go Premium", text: "Read these terms without the terms.", buttons: ["Maybe later"] },
    { title: "Still there", text: "Your session will expire. Your agreement won't.", buttons: ["Still here"] }
  ];
  var appPopups = {
    kettle: [{ title: "Kettle update", text: "Your kettle wants to update. It isn't asking.", buttons: ["Update now", "Update now"] }],
    dog: [{ title: "New match", text: "A labrador called Dave likes your dog's photo.", buttons: ["View later"] }],
    bank: [
      { title: "Was this you", text: "£0.01 sent to a horse.", buttons: ["Yes", "It was me"] },
      { title: "Security check", text: "Please confirm you are still you.", buttons: ["I am me"] }
    ]
  };

  // What the cast say. Legal is the company's lawyer: paid by the word, and
  // personally offended by anyone who reads. The mascots smile at everything.
  var lines = {
    legal: {
      caught: ["Objection.", "That was load-bearing.", "Who taught you to read.", "That took me a weekend.",
               "Fine. Have that one.", "I'm paid by the word.", "Nobody reads that far.", "Reading is a breach of clause 9.",
               "That one had a family.", "I'll put it back later.", "Struck. Rude.", "You're not meant to read it."],
      wrong: ["That one was fine, you melon.", "Billable.", "That's an afternoon. Billed.", "Perfectly good clause, you numpty.",
              "Stet. Look it up.", "Read it again, you plonker.", "My invoice is in the post.", "Normal clause. Normal.",
              "That's £600, you lemon.", "I'll be billing you for that."],
      missed: ["Lovely.", "Binding now.", "Signed. Sealed.", "Pleasure doing business.", "That's legally yours now.",
               "Agreed. No takebacks.", "Lovely. Next."],
      pen: ["I'll take that pen.", "Pen. Now.", "Give me that, you absolute weapon."],
      amend: ["Small change.", "Tiny edit. Ignore me.", "Just one word.", "Nothing to see here."],
      sting: ["You read to the end. Who does that.", "That was a perfectly good start to a sentence.", "Nobody gets to the end."],
      small: ["Nobody reads the small print.", "That footnote was private.", "You read the asterisk. Rude."],
      amendCaught: ["I was only tidying.", "That was a typo. Legally.", "Overruled. By you. Somehow."],
      streak: ["Stop reading.", "Somebody stop them.", "Are you a lawyer.", "This is very unusual."],
      accept: ["Pleasure.", "All binding.", "That's a yes."],
      skim: ["That's the spirit.", "Faster. Don't read it.", "Good. Scroll past.", "Lovely. Keep scrolling."]
    },
    mascot: {
      caught: ["Good catch. We'll put it back.", "You're reading. That's unusual.", "We love readers. We keep a list.",
               "Ooh. Somebody's careful."],
      missed: ["Thanks for agreeing.", "Wonderful.", "You're the best.", "Agreed with love."],
      wrong: ["Ooh.", "Legal won't like that.", "That one was nice."],
      popup: ["Still reading. Amazing.", "Rate us. Please. Please."],
      accept: ["Thanks for accepting.", "Nobody reads them anyway.", "Welcome aboard. There's no way off."],
      decline: ["Ha. Good one.", "There's no decline. It's a picture of one."],
      skim: ["Skimming. We love that.", "Wheee."],
      waited: "I've accepted for you. You're welcome."
    }
  };

  window.TermsClauses = {
    normal: normal, bad: bad, sting: sting, smallBad: smallBad, smallOk: smallOk, amend: amend,
    headings: headings, apps: apps, popups: popups, appPopups: appPopups, lines: lines
  };
})();
