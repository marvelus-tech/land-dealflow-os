// Source-backed buyer/agent call script bank.
// Stored as operator copy with timestamps; do not fabricate missing claims.
export const outreachScriptPacks = [
  {
    "id": "buyer-simple-prior-purchase-opener",
    "scope": "buyers",
    "label": "Prior-purchase buyer opener",
    "channel": "Call / SMS",
    "sourceTime": "10:32-11:02",
    "sourceUrl": "https://youtu.be/W0ERIegAd38?t=632",
    "title": "Ask a proven buyer if they want more deals",
    "when": "Use on Buyers after a row has recorded purchase proof but phone/email still needs manual verification.",
    "body": "Hey {{buyerName}}, I saw you bought a property in {{county}} recently. Are you looking for more deals like that?",
    "notes": [
      "Keep it simple; the video stresses not overplaying the pitch.",
      "If the buyer is an LLC, mail can work because it may reach their office/admin."
    ]
  },
  {
    "id": "buyer-list-permission-opener",
    "scope": "buyers",
    "label": "Buyer list permission",
    "channel": "Call / SMS",
    "sourceTime": "27:06-27:39",
    "sourceUrl": "https://youtu.be/W0ERIegAd38?t=1626",
    "title": "Build the buyer list before a deal without pretending",
    "when": "Use when contacting active investors before you have a specific property under contract.",
    "body": "Hey {{buyerName}}, I\u2019m doing a bunch of marketing in {{county}} and I\u2019m getting land leads that look like they could be good deals. I saw you bought around {{areaOrZip}} recently. Would it be okay if I added you to my buyer list so when I find a good one I can send it to you?",
    "notes": [
      "Truth-first: do not claim a deal exists if it does not.",
      "Mention actual observed purchase activity when the row has proof."
    ]
  },
  {
    "id": "buyer-buy-box-questions",
    "scope": "buyers",
    "label": "Buy box questions",
    "channel": "Call",
    "sourceTime": "27:24-27:56",
    "sourceUrl": "https://youtu.be/W0ERIegAd38?t=1644",
    "title": "Find what makes them drop everything",
    "when": "Use after the buyer says yes to receiving deals.",
    "body": "I want to make sure I don\u2019t send you junk. What would be a deal I could send you that would make you drop everything and come look at it or buy it? Where are you buying? What types of lots do you look for? What\u2019s your strategy so I can bring you exactly what you want?",
    "notes": [
      "Capture geography, lot type, price point, exit strategy, speed, and disqualifiers.",
      "This answer should unlock seller sourcing only when it is specific enough."
    ]
  },
  {
    "id": "buyer-deal-in-hand-opener",
    "scope": "buyers",
    "label": "Deal-in-hand opener",
    "channel": "Call / SMS",
    "sourceTime": "01:57-02:28",
    "sourceUrl": "https://youtu.be/W0ERIegAd38?t=117",
    "title": "Position a real deal against what they already bought",
    "when": "Use when you have a real property under contract or a defensible deal packet.",
    "body": "Hey {{buyerName}}, I\u2019ve got another deal that looks similar to what you bought around {{areaOrZip}}. Would you like to take a look? I have a few people who may be interested, but I wanted to call you first to see if it fits what you\u2019re buying.",
    "notes": [
      "Use only when a real deal exists.",
      "The positioning is not needy: you have other potential buyers, but you are offering first look."
    ]
  },
  {
    "id": "buyer-partner-with-local-operator",
    "scope": "buyers",
    "label": "Local operator partnership",
    "channel": "Message",
    "sourceTime": "04:12-04:44",
    "sourceUrl": "https://youtu.be/W0ERIegAd38?t=252",
    "title": "Partner with an active local land operator",
    "when": "Use for active land sellers/investors/wholesalers with buyer reach or premium listings.",
    "body": "Hey {{name}}, I think I have a land deal in {{county}}. Would you be interested in partnering on it? I can bring the deal; if you already have buyers or a title-company path, we can split the upside 50/50 if it closes.",
    "notes": [
      "Do not offer a split unless the economics and assignment/title path allow it.",
      "Best for operators with proven active listings or local buyer access."
    ]
  },
  {
    "id": "buyer-direct-mail-note",
    "scope": "buyers",
    "label": "Buyer direct-mail note",
    "channel": "Mail",
    "sourceTime": "10:32-11:02 / 38:55-39:40",
    "sourceUrl": "https://youtu.be/W0ERIegAd38?t=632",
    "title": "Simple letter to prior buyers / LLC offices",
    "when": "Use when phone/email are not verified or the row is an LLC/entity where mail may reach an office.",
    "body": "{{buyerName}}\n{{mailingAddress}}\n\nHi {{buyerName}},\n\nI saw you recently bought land in {{county}}. I source vacant land and tax-deed-adjacent deals in this area. Are you looking for more land deals right now?\n\nIf yes, text or call me at {{yourPhone}} and tell me what areas, lot types, and price ranges you want.\n\nThanks,\n{{yourName}}",
    "notes": [
      "The video recommends always marketing for buyers: calls, letters, postcards.",
      "Keep claims source-backed and do not imply a relationship."
    ]
  },
  {
    "id": "agent-representation-opener",
    "scope": "agents",
    "label": "Realtor representation opener",
    "channel": "Call / Email",
    "sourceTime": "30:44-31:15",
    "sourceUrl": "https://youtu.be/W0ERIegAd38?t=1844",
    "title": "Get the agent\u2019s attention with representation/listing economics",
    "when": "Use on Agents with recent land sold activity.",
    "body": "Hey {{agentFirstName}}, my name is {{yourName}}. I\u2019m looking for a realtor to represent me in {{county}}. I don\u2019t have an agent representing me there right now, and I\u2019m looking for a listing agent who can help me list land properties. I\u2019m an investor based in {{yourMarket}}, and we\u2019re starting to do deals in this county. Do you mind if I ask you a few questions?",
    "notes": [
      "Lead with what the agent cares about: listings, commissions, repeat business.",
      "Do not claim you own a property unless you do."
    ]
  },
  {
    "id": "agent-generous-commission-close",
    "scope": "agents",
    "label": "Land commission / listing close",
    "channel": "Call / Email",
    "sourceTime": "31:24-31:56",
    "sourceUrl": "https://youtu.be/W0ERIegAd38?t=1884",
    "title": "Explain why land commission may be higher",
    "when": "Use after the agent engages and you need them to take small land deals seriously.",
    "body": "I\u2019ve got a deal I\u2019m thinking about buying, and I\u2019m looking for a realtor who can help me buy it and then sell it again. On land, I\u2019m open to paying a generous commission because the price points are lower than houses. I\u2019m mainly looking for someone who has already sold land recently and can help me move it fast and cleanly.",
    "notes": [
      "The video mentions 8-10% commissions as a tactic; set final commission case-by-case.",
      "Agent should have real recent land sold proof."
    ]
  },
  {
    "id": "agent-resource-and-referral-questions",
    "scope": "agents",
    "label": "Agent resource questions",
    "channel": "Call",
    "sourceTime": "34:11-35:01",
    "sourceUrl": "https://youtu.be/W0ERIegAd38?t=2051",
    "title": "Ask for title companies, buyers, and other properties",
    "when": "Use after an agent shows local land competence.",
    "body": "Do you know any good investor-friendly or creative-real-estate-friendly title companies in this area? Do you already have buyers for land like this? Also, do you have any other properties, or do you know anybody else who has land they might want to sell?",
    "notes": [
      "This turns the agent into a local resource node, not just a listing contact.",
      "Capture title company, buyer names, seller leads, and area warnings."
    ]
  }
];
