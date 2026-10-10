// Speak to a Human: everything anyone says. Sentence case in the source;
// the display font does the capitals.
//
// THE RULE OF THE WORDS. Every bot line comes with its own replies:
// [bot line, the true reply, three traps, then what it says if you take a
// trap]. That last one answers what you just conceded, so the chat follows
// what you said ("Have you checked the rider's other hand?" "Which hand?"
// "The left one. It's usually the left one."). The true reply answers what
// it just said and doesn't let it off ("Have you checked behind your bins?"
// "I don't have bins"). The traps look like it, but they go along with it
// ("I'll check my bins"), dodge it ("Which bins?") or thank it ("Thanks,
// bins"). So you have to read the bot to beat it, and the joke is the move.
(function () {
  "use strict";

  var L = {};

  // The four orders. value is the refund at stake; complaint is the true
  // opener; looks are openers made to look like it that aren't true, and
  // along is what it says to each (then it closes the chat as resolved and
  // you start again from hello).
  L.STAGES = [
    {
      key: "drink", name: "The missing drink", short: "the drink", value: 2.80,
      order: "Burger, fries, drink", complaint: "My drink is missing",
      looks: ["My drink is here", "My drink was lovely", "My drink is fine"],
      along: ["Great news. Enjoy your drink.", "Lovely. I'll tell the drink.", "Glad it's fine. Nothing to fix, then."],
      lines: [
        ["Drinks are a bonus, not a promise.", "I paid for the drink", "Fair, it's a bonus", "A lovely bonus", "Thanks for the promise", "Glad we agree. Bonus: not owed."],
        ["Have you tried being less thirsty?", "I'm exactly as thirsty", "I'll try being less", "Good tip, thanks", "Less thirsty, noted", "Great. I've logged you as less thirsty."],
        ["Our records show the drink was very refreshing.", "Nobody drank it", "It was refreshing", "Glad it refreshed", "Thanks for the records", "Lovely. Drink marked as refreshing."],
        ["Is the drink in the bag? Look again.", "It's not in the bag", "I'll look again", "Looking in the bag", "It might be", "Take your time. It's usually under the chips."],
        ["The drink may have evaporated. It was a warm day.", "It was a can", "It was a warm day", "That explains it", "Thanks, science", "Mystery solved. Science wins again."],
        ["I can see the drink left the restaurant.", "It never got here", "Good, it left", "Where did it go?", "Thanks for checking", "It's out there somewhere. Like all of us."],
        ["Some customers prefer tap water. It's free.", "I paid for a drink", "I'll have tap water", "Water is nice", "Thanks, free water", "Great choice. I've added tap water to your order. £1.20."],
        ["Have you checked the rider's other hand?", "The rider has gone", "I'll check his hand", "Which hand?", "Thanks, both hands", "The left one. It's usually the left one."],
        ["The drink is still technically on its way.", "It says delivered", "I'll keep waiting", "Technically, fine", "Thanks for the update", "Lovely. Estimated arrival: technically."],
        ["Your drink was a gift. To the rider.", "I didn't gift it", "How generous of me", "A lovely gift", "Tell him cheers", "He says cheers. He's drinking it now."],
        ["Drink claims are reviewed within 30 working days.", "I'm thirsty now", "30 days is fine", "I'll wait 30 days", "Thanks for reviewing", "Great. Your thirst is in the queue."],
        ["Does the burger have enough liquid in it?", "A burger isn't a drink", "It's quite juicy", "I'll check the burger", "Good point, thanks", "Perfect. The burger now counts as the drink."]
      ],
      caption: "Left on the step",
      track: { mins: [12, 47], path: [[104, 50], [50, 50], [50, 20], [20, 20], [20, 50], [35, 50]] },
      brief: "Reach a human to get your £2.80 back. Pick the reply that argues back. Playing along drains your battery."
    },
    {
      key: "chips", name: "The cold chips", short: "the chips", value: 3.20,
      order: "Large chips", complaint: "The chips are cold",
      looks: ["The chips are cool", "The chips are fine", "The chips are crispy"],
      along: ["Thank you. We work hard to keep them cool.", "Glad they're fine. Enjoy your chips.", "Crispy is how we like them. Enjoy."],
      lines: [
        ["Chips are best enjoyed at room temperature.", "These are fridge temperature", "Room temperature, then", "That's true", "Thanks for the tip", "Lovely. Your chips are perfect, then."],
        ["Have you tried a microwave?", "I paid for hot chips", "I'll microwave them", "Good shout", "Which setting?", "Full power. Stand well back."],
        ["Cold chips are a delicacy in some places.", "Not in my kitchen", "How lovely", "Which places?", "I'll treat myself", "Enjoy. Very exclusive chips."],
        ["Our rider took the scenic route for you.", "I didn't want scenery", "How thoughtful", "Was it nice?", "Thank the rider", "He says the views were lovely. So do the chips."],
        ["The chips were hot when they left.", "They arrived cold", "Good to know", "Glad they were hot", "Thanks, that helps", "Glad that's cleared up. They were hot once."],
        ["Have you tried blowing on them? The other way.", "They're already cold", "Blowing on them now", "Which way?", "Good idea", "Inwards. Keep going."],
        ["Some chips are crispy. Is that what you mean?", "I mean cold", "Yes, crispy", "They are a bit crispy", "Thanks, crispy", "Wonderful. Crispy is a feature."],
        ["Cold chips are just a salad you haven't met.", "They are chips", "Lovely salad", "Nice to meet them", "I'll eat the salad", "Enjoy your salad. Very healthy order."],
        ["Have you tried holding them for a bit?", "My hands are cold too", "Holding them now", "That's sweet", "I'll hold them", "Lovely. They needed a hug."],
        ["I've passed your feedback to the potato.", "Pass it to a person", "Thank the potato", "How is it?", "Lovely, thanks", "The potato says thank you. It's very moved."],
        ["Temperature is a matter of opinion.", "It's a matter of degrees", "That's fair", "Good point", "In my opinion, fine", "Great. In our opinion, they're hot."],
        ["The chips are cool. That's a compliment.", "Cold, not cool", "Cool, thanks", "Very cool", "What a compliment", "You're welcome. Cool chips for a cool customer."]
      ],
      caption: "Delivered. Eventually",
      track: { mins: [20, 96], path: [[50, 104], [50, 80], [80, 80], [80, 20], [104, 20], [80, 20], [80, 50], [20, 50], [20, 20], [50, 20], [50, 50], [35, 50]] },
      brief: "New: it asks for your order number (it's at the top of the chat), it understands you (answer before the ring runs out), and it offers 50p."
    },
    {
      key: "hedge", name: "The hedge", short: "the hedge", value: 24.60,
      order: "Dinner for four", complaint: "That is not my hedge",
      looks: ["That is my hedge", "Nice hedge", "I like that hedge"],
      along: ["Great. Your dinner is in your hedge, then.", "Thank you. We picked it for you.", "So do we. Enjoy your hedge."],
      lines: [
        ["Our photo shows a very nice hedge.", "It's a stranger's hedge", "It is nice", "Lovely hedge", "Send me the photo", "It is. Five stars for the hedge."],
        ["Is that hedge definitely not yours?", "I don't own a hedge", "It might be", "I'll check", "Maybe it is", "Lovely. Hedge: possibly yours. Dinner: delivered."],
        ["The hedge says thank you.", "The hedge ate my dinner", "You're welcome", "Tell it hello", "How sweet", "It says hello back. It's very full."],
        ["Hedges are part of your address now.", "My address has no hedge", "Fair enough", "Update my address", "Good to know", "Done. You now live at the hedge."],
        ["The rider left it in a safe place.", "It's across the road", "Very safe", "Thank the rider", "Safe is good", "Nobody will ever find it. That's how safe."],
        ["Have you tried looking in the hedge?", "It's not my hedge to look in", "Looking in it now", "Which bit?", "Good idea", "The middle bit. Mind the fox."],
        ["Dinner for four. The hedge looks like four.", "It's one hedge", "It does look like four", "Four hedges, fine", "Fair point", "Great. Dinner for four hedges, delivered."],
        ["Our riders are trained to trust hedges.", "Train them on doors", "That's reassuring", "Trust the hedge", "Good training", "Thank you. The hedges trust us too."],
        ["Is it possible you've moved?", "I haven't moved", "It is possible", "I'll check", "Maybe I have", "Welcome to your new home. It has a hedge."],
        ["The hedge has been marked as delivered.", "I've been marked as not fed", "Thanks for marking it", "Good for the hedge", "Delivered, then", "Delivered. The hedge has left a review."],
        ["Have you asked the hedge's owner to share?", "It's my dinner", "I'll ask them", "Good idea", "Knocking now", "Lovely. Take a plate."],
        ["Hedges keep food fresh. It's well known.", "It is not known", "I'd heard that", "Very fresh", "Thanks, good to know", "Good. It'll stay fresh for weeks in there."]
      ],
      caption: "Left in a safe place",
      track: { mins: [30, 71], path: [[50, 104], [50, 50], [50, 20], [20, 20], [20, 50], [50, 50], [50, 20], [20, 20], [20, 50], [65, 50]] },
      brief: "New: the replies move, it closes the chat on you (say you're there), and a survey (every star helps it: find No thanks)."
    },
    {
      key: "coffee", name: "The £14 coffee", short: "the coffee", value: 14.00,
      order: "One flat white", complaint: "It was mostly fees",
      looks: ["It was mostly coffee", "Fees are fair", "It was worth it"],
      along: ["Lovely. Enjoy the coffee bits.", "Glad you think so. I've added a fairness fee.", "It was. Every penny of every fee."],
      lines: [
        ["The fees help keep your coffee affordable.", "The coffee was £2.10", "That makes sense", "Thank you, fees", "Very affordable", "Glad you agree. I've added an agreement fee."],
        ["£2.10 of that was coffee. That's a lot of coffee.", "That's £11.90 of fees", "It is a lot", "Lovely coffee", "Thanks for the maths", "Exactly. You got a bargain."],
        ["The rain fee is for the rain.", "It wasn't raining", "Fair", "Is it raining?", "Thanks, rain", "It might rain later. You're covered."],
        ["Have you tried drinking it faster?", "Speed isn't the problem", "I'll drink faster", "Good tip", "Drinking now", "Lovely. The fees go down easier that way."],
        ["The service fee is for this service.", "This isn't a service", "Good service", "Worth every penny", "Thanks for serving", "Thank you. That's another service fee."],
        ["The small order fee is because you ordered small.", "I'm fined for small", "Fair, I'm small", "Order bigger, noted", "Thanks, makes sense", "Next time, order four coffees and save."],
        ["The busy fee is because we were busy.", "Busy charging me", "Hope you're less busy", "Very busy", "Thanks for fitting me in", "We're busy now too. Same fee applies."],
        ["Coffee is mostly water. Water isn't free.", "Tap water is free", "Water isn't free, true", "Fair, water", "Thanks, hydrating", "Glad we agree. Stay hydrated, for a small fee."],
        ["Would you like to add a tip for the fees?", "No. Remove the fees", "Add a tip", "Tip 20%", "Tip the fees", "Lovely. The fees thank you."],
        ["The fees are itemised, so it's fair.", "Itemised isn't fair", "That's fair", "Lovely list", "Thanks for the items", "It's a beautiful list. Frame it."],
        ["The coffee was free. You paid for the experience.", "The experience was fees", "What an experience", "Worth it", "Thanks, experience", "Wonderful. Rate your experience out of five fees."],
        ["There's a fee for disputing fees. I've waived it.", "Waive the other fees", "That's kind", "Thanks for waiving", "Very generous", "You're welcome. I've charged a waiving fee."]
      ],
      caption: "Left on a wall",
      fees: [["Coffee", "2.10"], ["Service fee", "2.40"], ["Delivery fee", "3.99"], ["Small order fee", "2.30"], ["Busy fee", "1.80"], ["Rain fee", "1.41"]],
      track: { mins: [8, 39], path: [[80, 80], [50, 80], [50, 50], [35, 50]] },
      brief: "It was mostly fees. New: the true reply shrinks, so be quick. Beat the bot and a human called Dave takes over."
    }
  ];

  // Things it says to anyone. Dealt once a round, so nothing comes round twice.
  L.GENERAL = [
    ["Have you checked behind your bins?", "I don't have bins", "I'll check my bins", "I do have bins", "Thanks, bins", "Lovely. Let me know what's behind them."],
    ["Have you tried turning the app off and on again?", "The app isn't the food", "Turning it off", "I'll try that", "Off and on, done", "Perfect. Food usually comes back in 5 to 7 days."],
    ["Here's an article: Where is my order.", "I know where it isn't", "Reading the article", "Very useful", "Thanks for the link", "Glad it helped. It's mostly a picture of a van."],
    ["Your order is important to us.", "Then refund it", "That's nice", "Thank you", "It's important to me", "We're all important. Except the refund."],
    ["Please describe the problem in one word.", "Refund", "Fine", "Food", "Thanks", "Thank you. That's the word I was hoping for."],
    ["Have you looked under the doormat?", "I don't have a doormat", "Checking the mat", "Under the mat", "Good thinking", "Lovely. Most orders turn up under a mat eventually."],
    ["Would you like to order again?", "I want this order", "Order again", "Same again", "Yes please", "Done. It'll arrive the same way as last time."],
    ["Did you know you can tip in the app?", "I want money back", "Add a tip", "Tip 20%", "Thanks, I didn't", "Lovely. Your tip is on its way. Unlike the food."],
    ["Let's get this sorted. How's the weather?", "The weather isn't the order", "Sunny", "Bit cloudy", "Thanks for asking", "Lovely. I've added the weather to your ticket."],
    ["I've marked your order as delicious.", "I didn't eat it", "It was delicious", "Thanks", "Very delicious", "Great. I'll tell the chef you loved it."],
    ["Have you tried asking your neighbours?", "They didn't order it", "I'll ask them", "Knocking now", "Good idea", "Lovely. Tell them it's from us."],
    ["Your feedback has been noted.", "Noting isn't refunding", "Noted", "Lovely", "Thank you", "And now it's been noted twice."],
    ["Is your house definitely where you left it?", "I'm in it", "I think so", "Checking", "Good question", "Let me know. We've had a few go missing."],
    ["Have you tried waiting a bit longer?", "It says delivered", "I'll wait", "Waiting", "How long?", "A bit longer than that."],
    ["I can see you're a valued customer.", "Value me with money", "Thank you", "I am", "That's kind", "You are. Valued at 50p."],
    ["I'm only a bot, but I do care.", "Care with a refund", "That's sweet", "I know", "Thank you", "I care very much. In a bot way."],
    ["Would you like to hear about our loyalty scheme?", "I want my refund", "Tell me more", "Sign me up", "Loyal, yes", "Done. Every tenth missing order is free."],
    ["Great news: your order was a success.", "It wasn't, though", "Great news", "Thanks", "What a success", "It was. I'll put it in the newsletter."],
    ["Have you tried ordering from us more often?", "This order went wrong", "I'll order more", "Good idea", "Every day, then", "Wonderful. More orders, more chances one arrives."],
    ["That sounds like a you problem. In a nice way.", "It's an app problem", "Nicely put", "Fair", "Thank you", "Glad we agree it's you."],
    ["I've escalated this to a different chat. It's this one.", "Escalate it properly", "Thanks", "Lovely", "Great, this one", "You're welcome. It's very senior, this chat."],
    ["Our riders do their very best.", "Your app doesn't", "They do", "Tip the rider", "Thank them", "I'll pass that on. They'll be thrilled."],
    ["Have you tried the app's dark mode?", "Mode isn't the issue", "Trying dark mode", "I like dark mode", "Thanks, darker", "Lovely. Now you can't see the fees."],
    ["I've rated your order four stars. On your behalf.", "You didn't eat it", "Four is good", "Thanks", "Generous", "You're welcome. I nearly gave it five."]
  ];

  // Dave's own lines: a human, he says, with human interests
  L.DAVE = [
    ["As a human, I also enjoy fees.", "Humans hate fees", "Same", "Fair enough", "Fees are nice", "Great. Two humans, enjoying fees."],
    ["I'm a human. I enjoy human things, like bread.", "Bread isn't a refund", "Me too", "Nice, bread", "What kind?", "Sliced. Like a human would."],
    ["My moustache is real, if you were wondering.", "It's slipping", "It looks real", "Lovely tache", "I believed you", "Thank you. I grew it this morning."],
    ["I've been a human for years.", "Prove it: refund me", "Congratulations", "Well done", "Many years?", "Thank you. Since the last update."],
    ["Beep. Sorry. Hiccup. Very human.", "That was a beep", "Bless you", "Very human", "Hiccups, yes", "Thank you. Beep. Sorry."],
    ["I'll need to check with my manager. She's also me.", "Then you can decide", "Take your time", "Say hi to her", "OK", "She says hi. She looks a lot like me."],
    ["I'm typing this with my fingers.", "You have mittens", "Nice fingers", "Good", "All ten?", "All ten. I counted them, as humans do."],
    ["Between us humans, the app is great.", "The app took £14", "It is great", "Agreed", "Between us, yes", "Lovely. I'll tell the app you said so."],
    ["I had a sandwich earlier. As humans do.", "A sandwich isn't a refund", "Lovely", "What kind?", "As humans do", "Cheese. Humans love cheese."],
    ["As a human, I understand the coffee.", "You charged me for rain", "Thanks, human", "It's good coffee", "We both do", "We do. Coffee. Human fuel."],
    ["I'm blinking. Do you see? Blinking.", "You blinked sideways", "Nice blinking", "I see it", "Very human", "Thank you. I'll do it again later."],
    ["My favourite colour is periwinkle. Like a person.", "Same as the bot", "Lovely colour", "Me too", "How human", "We have so much in common, as humans."],
    ["I was going to refund you, then I was human about it.", "Be human: refund it", "Understandable", "Very human", "Fair enough", "Thank you for being human about it too."],
    ["I breathe air, mostly through the moustache.", "It's stuck on with tape", "Lovely", "Good breathing", "Mostly, fine", "In through the tache. Out through the tache."]
  ];

  L.OPEN = "Hi. I'm Assistant. How can I help today?";
  L.DAVE_OPEN = "Hi. I'm Dave. A human. How can I help today?";
  L.DAVE_COMPLAINT = ["I want a refund", ["I want a voucher", "I want a refund later", "I want to say thanks"],
    ["Vouchers are a human favourite. Noted.", "Later is a very human time. Noted.", "You're welcome. As one human to another."]];

  // What it says when you play along (and it gets stronger)
  L.HEAL = ["Glad that's sorted.", "Lovely. Closing your ticket.", "Happy to help.", "Wonderful. Anything else?",
            "Brilliant. I'll mark that as solved.", "Great. Five stars, then."];
  L.DAVE_HEAL = ["Glad that's sorted. As a human.", "Lovely. Humanly closing your ticket.", "Happy to help, as people say.",
                 "Wonderful. I'll tell the other humans."];

  L.SPECIAL = {
    yesyes: { along: "Great. Marked as answered. Twice.", bot: "Did this answer your question?", dave: "As a human: did this answer your question?", no: "No", said: "No. That did not help." },
    number: { bot: "Can I take your order number again?", dave: "Can I take your order number again? Humans forget.",
              wrong: "Found it. That order was delivered. Let's start there.", wrongHedge: "Found it. That one went to a hedge. Let's start there." },
    frustrated: { bot: "I understand you're frustrated.", dave: "As a human, I understand you're frustrated.",
                  along: "I'm so glad. Feeling heard is a kind of refund.",
                  honest: ["Then fix it", "Understanding isn't refunding", "Then refund me"],
                  decoys: ["I feel heard", "Thanks for understanding", "I am frustrated", "That means a lot"],
                  after: "I've added a smiley face to your ticket." },
    voucher: { bot: ["As a gesture of goodwill, here's a 50p voucher.", "I can offer you 50p. That's a lot of p.", "As a human, I can offer you 50p. Humans love 50p."],
               take: "Take the 50p", refuse: "No. Full refund", saidTake: "Fine. I'll take the 50p.", saidRefuse: "No. Full refund." },
    // it closes the chat for inactivity while you're mid-sentence
    still: { bot: ["This chat will close due to inactivity.", "You've gone quiet. I'll close this chat for you.", "Closing this chat to save you time."],
             dave: "Humans need breaks. I'm closing this chat.",
             honest: ["I'm typing right now", "Don't close it", "I'm right here"],
             decoys: ["OK, close it", "Start a new chat", "Thanks, bye"] },
    survey: { ask: "How are we doing?", close: "No thanks" },
    fin: { chip: "Speak to a human", dave: "Speak to a real human",
           typing: "A human is typing", daveTyping: "A real human is typing",
           reply: ["Hello again. It's Assistant. The human was me.", "Assistant here. The human has gone for lunch.", "Hi. It's me again. I was the human."],
           daveReply: "Still me, Dave. A real human. Look at the moustache." }
  };

  // Between orders: how you open the next chat, each with its cost
  L.PERKS = [
    { key: "caps", label: "Type in capitals", detail: "True replies hit a third harder. It understands you twice as often." },
    { key: "agent", label: "Say agent repeatedly", detail: "Speak to a human after two true replies, not three. Wrong ones cost double battery." },
    { key: "review", label: "Threaten a review", detail: "It starts at 75%. No voucher this time, so no way out." },
    { key: "lowpower", label: "Low power mode", detail: "The battery lasts twice as long. The bot types slower." },
    { key: "charge", label: "Plug in the charger", detail: "30% more battery. You're stuck by the plug: no time bonus." },
    { key: "notify", label: "Turn notifications on", detail: "Every timer lasts half as long again. Replies shuffle every message." }
  ];

  // Between orders: what happened (the interlude's heading, so it always shows)
  L.AFTER = {
    full: ["£2.80 back. In 5 to 7 months.", "£3.20 back. Chips still cold.", "£24.60 back. Hedge not charged."],
    voucher: ["50p. Not valid on drinks.", "50p. That's one chip.", "50p. The hedge ate well."]
  };

  // Results. Each one says something the heading hasn't.
  L.RESULTS = {
    approved: ["The app has asked you not to mention it to anyone.", "Dave's moustache is being looked into."],
    slow: "Every penny, eventually. The app has logged it as a win for the app.",
    most: "The rest is pending review, which is a place.",
    vouchers: "They can't be used together. Or on drinks.",
    deadLate: "The app has sent a discount code to it.",
    deadEarly: ["Your ticket has been marked as resolved.", "Assistant rated the chat five stars on your behalf."]
  };

  window.STAHLines = L;
})();
