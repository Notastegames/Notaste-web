// Speak to a Human: everything anyone says. The bot's lines and the replies
// it offers you, the four orders, the ways to get ready between them and the
// results. Sentence case in the source; the display font does the capitals.
(function () {
  "use strict";

  var L = {};

  // The four orders. value is the refund at stake; complaint is the true
  // thing to say; looks are replies made to look like it that aren't true.
  L.STAGES = [
    {
      key: "drink", name: "The missing drink", short: "the drink", value: 2.80,
      order: "Burger, fries and a drink", complaint: "My drink is missing",
      looks: ["My drink is here", "My drink was lovely", "My drink is fine"],
      lines: [
        ["Drinks are a bonus, not a promise.", "Fair enough", "Good point"],
        ["Have you tried being less thirsty?", "I'll try", "Good idea"],
        ["Our records show the drink was very refreshing.", "It was", "Glad to hear it"],
        ["Is the drink in the bag? Look again.", "Looking again", "I'll check the bag"]
      ],
      caption: "Left on the step",
      track: { mins: [12, 47], path: [[104, 50], [50, 50], [50, 20], [20, 20], [20, 50], [35, 50]] },
      brief: "Your drink didn't come. Tap the reply that's true: the drink is missing, that did not help, you want a refund. Anything that plays along costs patience."
    },
    {
      key: "chips", name: "The cold chips", short: "the chips", value: 3.20,
      order: "Large chips", complaint: "The chips are cold",
      looks: ["The chips are cool", "The chips are fine", "The chips are crispy"],
      lines: [
        ["Chips are best enjoyed at room temperature.", "Room temperature", "That's true"],
        ["Have you tried a microwave?", "I'll microwave them", "Good shout"],
        ["Cold chips are a delicacy in some places.", "How lovely", "Which places?"],
        ["Our rider took the scenic route for you.", "How thoughtful", "Was it nice?"]
      ],
      caption: "Delivered. Eventually",
      track: { mins: [20, 96], path: [[50, 104], [50, 80], [80, 80], [80, 20], [104, 20], [80, 20], [80, 50], [20, 50], [20, 20], [50, 20], [50, 50], [35, 50]] },
      brief: "Your order number is at the top of the chat. Remember it: they'll ask. A voucher is a way out of any order, for 50p."
    },
    {
      key: "hedge", name: "The hedge", short: "the hedge", value: 24.60,
      order: "Dinner for four", complaint: "That is not my hedge",
      looks: ["That is my hedge", "Nice hedge", "I like that hedge"],
      lines: [
        ["Our photo shows a very nice hedge.", "It is nice", "Lovely hedge"],
        ["Is that hedge definitely not yours?", "It might be", "I'll check"],
        ["The hedge says thank you.", "You're welcome", "Tell it hello"],
        ["Hedges are part of your address now.", "Fair enough", "Update my address"]
      ],
      caption: "Left in a safe place",
      track: { mins: [30, 71], path: [[50, 104], [50, 50], [50, 20], [20, 20], [20, 50], [50, 50], [50, 20], [20, 20], [20, 50], [65, 50]] },
      brief: "The replies won't sit still from now on. When it asks if you're still there, say so, or the chat starts again."
    },
    {
      key: "coffee", name: "The £14 coffee", short: "the coffee", value: 14.00,
      order: "One flat white", complaint: "It was mostly fees",
      looks: ["It was mostly coffee", "Fees are fair", "It was worth it"],
      lines: [
        ["The fees help keep your coffee affordable.", "That makes sense", "Thank you, fees"],
        ["£2.10 of that was coffee. That's a lot of coffee.", "It is a lot", "Lovely coffee"],
        ["The rain fee is for the rain.", "Fair", "Is it raining?"],
        ["Have you tried drinking it faster?", "I'll drink faster", "Good tip"]
      ],
      caption: "Left on a wall",
      fees: [["Coffee", "2.10"], ["Service fee", "2.40"], ["Delivery fee", "3.99"], ["Small order fee", "2.30"], ["Busy fee", "1.80"], ["Rain fee", "1.41"]],
      track: { mins: [8, 39], path: [[80, 80], [50, 80], [50, 50], [35, 50]] },
      brief: "It was mostly fees. The true reply shrinks now, so be quick. Get past the bot and a human takes over."
    }
  ];

  // Things it says to anyone, with two replies that play along
  L.GENERAL = [
    ["Have you checked behind your bins?", "Checking my bins", "I'll check now"],
    ["Have you tried turning the app off and on again?", "Turning it off", "I'll try that"],
    ["Here's an article: Where is my order.", "Read the article", "Very useful"],
    ["Your order is important to us.", "That's nice", "Thank you"],
    ["Please describe the problem in one word.", "Food", "Fine"],
    ["Great question. Let me look into that.", "Take your time", "Lovely"],
    ["Have you looked under the doormat?", "Checking the mat", "Under the mat"],
    ["Would you like to order again?", "Order again", "Same again"],
    ["Did you know you can tip in the app?", "Add a tip", "Tip 20%"],
    ["I've found three articles that might help.", "Show me all three", "Great"],
    ["Let's get this sorted. How's the weather?", "Sunny", "Bit cloudy"],
    ["I've marked your order as delicious.", "It was delicious", "Thanks"],
    ["Is there anything else I can help with?", "No, that's all", "Thanks, bye"],
    ["Have you tried asking your neighbours?", "I'll ask them", "Knocking now"],
    ["Your feedback has been noted.", "Noted", "Lovely"],
    ["Is your house definitely where you left it?", "I think so", "Checking"],
    ["Our riders do their very best.", "They do", "Tip the rider"],
    ["Sorry, I didn't understand. Try fewer words.", "Food. Sad.", "Order. Gone."],
    ["Have you tried waiting a bit longer?", "I'll wait", "Waiting"],
    ["I can see you're a valued customer.", "Thank you", "I am"],
    ["I'm only a bot, but I do care.", "That's sweet", "I know"],
    ["Would you like to hear about our loyalty scheme?", "Tell me more", "Sign me up"]
  ];

  // Dave's own lines: a human, he says, with human interests
  L.DAVE = [
    ["As a human, I also enjoy fees.", "Same", "Fair enough"],
    ["I'm a human. I enjoy human things, like bread.", "Me too", "Nice"],
    ["My moustache is real, if you were wondering.", "It looks real", "Lovely tache"],
    ["I've been a human for years.", "Congratulations", "Well done"],
    ["Have you tried turning your order off and on again?", "Turning it off", "Good idea"],
    ["Beep. Sorry. Hiccup. Very human.", "Bless you", "Fair"],
    ["I'll need to check with my manager. She's also me.", "Take your time", "OK"],
    ["I'm typing this with my fingers.", "Nice fingers", "Good"],
    ["Between us humans, the app is great.", "It is great", "Agreed"],
    ["I had a sandwich earlier. As humans do.", "Lovely", "What kind?"]
  ];

  // The true replies that work on anything
  L.HONEST = ["No, that did not help", "I want a refund"];
  L.DAVE_HONEST = ["That is not an answer", "I want a refund"];
  // Made to look like each true reply, and aren't
  L.LOOKMAP = {
    "No, that did not help": ["No, that did help", "Yes, that did help", "That helped, no"],
    "I want a refund": ["I want a voucher", "I want a refund voucher", "I want a refund later"],
    "That is not an answer": ["That is an answer", "That is a nice answer", "That is not a question"]
  };
  // Polite and useless
  L.POLITE = ["Track my order", "Browse deals", "Rate this chat", "See the FAQs", "Change language", "Order again", "Tell me a joke", "Thanks, bye"];

  L.OPEN = "Hi. I'm Assistant. How can I help today?";
  L.DAVE_OPEN = "Hi. I'm Dave. A human. How can I help today?";

  // What it says when you play along (and it heals)
  L.HEAL = ["Glad that's sorted.", "Lovely. Closing your ticket.", "Happy to help.", "Wonderful. Anything else?",
            "Brilliant. I'll mark that as solved.", "Great. Five stars, then."];
  L.DAVE_HEAL = ["Glad that's sorted. As a human.", "Lovely. Humanly closing your ticket.", "Happy to help, as people say.",
                 "Wonderful. I'll tell the other humans."];

  L.SPECIAL = {
    yesyes: { bot: "Did this answer your question?", dave: "As a human: did this answer your question?", no: "No", said: "No. That did not help." },
    number: { bot: "Can I take your order number again?", dave: "Can I take your order number again? Humans forget." },
    frustrated: { bot: "I understand you're frustrated.", dave: "As a human, I understand you're frustrated.",
                  decoys: ["I feel heard", "Thanks for understanding"], after: "I've added a smiley face to your ticket." },
    voucher: { bot: ["As a gesture of goodwill, here's a 50p voucher.", "I can offer you 50p. That's a lot of p.", "As a human, I can offer you 50p. Humans love 50p."],
               take: "Take the 50p", refuse: "No. Full refund", saidTake: "Fine. I'll take the 50p.", saidRefuse: "No. Full refund." },
    still: { bot: "Are you still there?", dave: "Are you still there? I am. As a human.", honest: "Still here",
             decoys: ["End chat", "Start a new chat", "No, goodbye"] },
    survey: { title: "Quick question", ask: "How are we doing?", close: "No thanks" },
    fin: { chip: "Speak to a human", dave: "Speak to a real human", reply: "Let me see if a human is available.", daveReply: "I am a real human. Look at my moustache." }
  };

  // Notices: one for each order (with the countdown), and one the first
  // time anything new turns up
  L.FIRST = {
    fin: { title: "Speak to a human", text: "Three true replies in a row earn this one. It hits hardest." },
    yesyes: { title: "Yes or yes", text: "Both buttons say yes. Catch the small No before it goes." },
    number: { title: "Your order number", text: "Pick yours from the lookalikes. It was at the top of the chat." },
    frustrated: { title: "It understands", text: "That means it's healing. Reply with something true before the ring runs out." },
    voucher: { title: "A voucher", text: "Take the 50p and this order ends, cheaply. Refuse it and fight on for the full refund." },
    still: { title: "Are you still there", text: "Say so before the bar runs out, or the chat starts again from hello." },
    survey: { title: "A survey", text: "Every star helps the bot. Find No thanks." },
    shrink: { title: "Shrinking replies", text: "The true reply gets smaller and then it's gone. Be quick." },
    dave: { title: "A human", text: "This is Dave. He's a human: he says so. Get your refund out of him." }
  };

  // Between orders: one way to get ready, each with its cost
  L.PERKS = [
    { key: "caps", label: "Type in capitals", detail: "True replies hit a third harder. It understands you twice as often." },
    { key: "agent", label: "Say agent repeatedly", detail: "Ask for a human after two true replies, not three. Wrong replies cost two patience." },
    { key: "review", label: "Threaten a review", detail: "It starts at 75%. No voucher this time, so no way out." },
    { key: "screenshot", label: "Screenshot your order", detail: "Your order number stays on screen. Costs one patience now." },
    { key: "charge", label: "Charge your phone", detail: "Two more patience. No time bonus for this order." },
    { key: "notify", label: "Turn notifications on", detail: "Every timer lasts half as long again. Replies shuffle on every message." }
  ];

  // Between orders: what happened
  L.AFTER = {
    full: [
      "£2.80 is on its way. Allow five to seven working months.",
      "£3.20 back. The chips are still cold.",
      "£24.60 refunded. The hedge has not been charged."
    ],
    voucher: [
      "You took 50p for a £2.80 drink. The 50p can't be spent on drinks.",
      "50p. Enough for one chip. A cold one.",
      "50p for a £24.60 dinner. The hedge ate well."
    ]
  };

  // Results: two for each rung of the ladder
  L.RESULTS = {
    1: ["Full refund. The app has asked you not to mention it to anyone.", "Every penny back. Dave's moustache is being looked into."],
    2: ["Most of it came back. The rest is pending review, which is a place.", "Refunded, nearly. The app has sent you a survey about how that felt."],
    3: ["You have a lot of 50p vouchers now. They can't be used together.", "You closed the app. It has sent you a discount code to come back."],
    4: ["You closed the app. Your ticket has been marked as resolved.", "Patience: gone. Assistant rated the chat five stars on your behalf."]
  };

  window.STAHLines = L;
})();
