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
,

  {
    "id": "agent-land-resale-price-reality-check",
    "scope": "agents",
    "label": "Resale price reality check",
    "channel": "Call",
    "sourceTime": "YPqUHvSAZrU 16:21-16:58",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=981",
    "title": "Ask the agent what buy price would let them resell the land",
    "when": "Use with land Realtors when a listed/agent-presented lot is priced high and you need the local resale truth without insulting the seller.",
    "body": "I am looking for an agent who can help me buy land in {{market}} and then sell it again cleanly. If you were helping me buy this lot and then relist it, what price would I need to buy it at so you could realistically sell it again?\n\nI am open to paying a strong land commission if you can help me move it, but I need the buy price to make sense for the current market.",
    "notes": [
      "Use only for land/lots, not houses.",
      "The transcript frames this as getting the Realtor to tell the truth about resale price instead of arguing their list price."
    ]
  },
  {
    "id": "agent-is-price-fair-market-check",
    "scope": "agents",
    "label": "Fair price check",
    "channel": "Call",
    "sourceTime": "YPqUHvSAZrU 16:00-16:28",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=960",
    "title": "Ask if the listed land price is fair in this market",
    "when": "Use when an agent is defending a land listing price and you need market-based pushback without sounding combative.",
    "body": "Do you think that is a fair price for this market right now?\n\nIf I bought it there, what would you expect we could realistically resell it for, and how long do you think that would take? I am not trying to beat anyone up; I just need the project math to be real.",
    "notes": [
      "Works best after you have recent land sales or active listing context.",
      "Keep it consultative; do not expose buyer max or assignment spread."
    ]
  },
  {
    "id": "agent-offer-presentation-check",
    "scope": "agents",
    "label": "Would seller entertain it?",
    "channel": "Call / Email",
    "sourceTime": "YPqUHvSAZrU 10:44-11:22",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=644",
    "title": "Ask the agent whether a land offer is worth presenting",
    "when": "Use after internal comping produces a specific land offer and the property is listed or agent-controlled.",
    "body": "I may be off, and I do not want to waste your time. Based on the land comps and what I would need to make the project work, I would probably be around {{offerAmount}}.\n\nDo you think the seller would entertain something in that neighborhood, or is that too far away to even put in front of them?",
    "notes": [
      "The transcript uses a deliberately humble frame before naming a lower offer.",
      "Do not use this as a luxury-property lowball. On premium lots, the number should be slightly under realistic retail, not commodity wholesale."
    ]
  },
  {
    "id": "land-owner-permission-agenda-opener",
    "scope": "deals",
    "label": "Owner permission opener",
    "channel": "Call / SMS",
    "sourceTime": "YPqUHvSAZrU 03:10-04:51 / 11:50-11:57",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=190",
    "title": "Open the owner call with a reluctant-buyer diagnostic frame",
    "when": "Use after a land owner replies or answers, before asking property and price questions.",
    "body": "Hey {{ownerFirstName}}, thanks for getting back to me. I am looking at land around {{market}}. Do you mind if I ask a few quick questions about the lot so I can verify the parcel and see if it is something my buyer side may be able to make a clean offer on?\n\nI will check the county/GIS records, title basics, access, and buyer fit. If it is not a fit, no pressure at all.",
    "notes": [
      "Source video stresses asking questions instead of pitching.",
      "Do not claim buyer certainty, clean title, utilities, access, or buildability until verified."
    ]
  },
  {
    "id": "land-owner-still-available-sms",
    "scope": "deals",
    "label": "Still available check",
    "channel": "SMS",
    "sourceTime": "YPqUHvSAZrU 06:10-06:30 / 08:00-08:12",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=370",
    "title": "Check if the vacant lot is still available without over-pitching",
    "when": "Use on warm owner responses, expired listings, or old owner leads before spending research time.",
    "body": "Hey {{ownerFirstName}}, I am checking back on the vacant lot near {{roadOrArea}}. Is that still something you would consider selling?",
    "notes": [
      "Keep it short and owner-safe.",
      "If the row is public-owner-only with no phone/email proof, keep it skip-trace/manual review."
    ]
  },
  {
    "id": "land-owner-parcel-identity-check",
    "scope": "deals",
    "label": "Parcel truth questions",
    "channel": "Call / SMS",
    "sourceTime": "YPqUHvSAZrU 12:00-14:10",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=720",
    "title": "Confirm APN, owner authority, listing status, and land facts",
    "when": "Use before pricing any owner conversation or writing an offer.",
    "body": "To make sure I am looking at the right lot, can you confirm the APN or tax parcel number? Address or nearest road works too if you do not have it handy.\n\nIs this one parcel or multiple? Are you the owner on title, or is it family, LLC, trust, or estate? Is it currently listed with an agent anywhere? Any known access, utility, flood, wetland, easement, HOA, title, or buildability issues?",
    "notes": [
      "Do not make the seller do public-record homework we can do ourselves.",
      "Ask for private or clarifying facts; verify county/GIS/title facts independently."
    ]
  },
  {
    "id": "land-owner-motivation-route-questions",
    "scope": "deals",
    "label": "Motivation and route",
    "channel": "Call / SMS",
    "sourceTime": "YPqUHvSAZrU 14:30-16:40",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=870",
    "title": "Find whether the owner wants retail price or clean certainty",
    "when": "Use after parcel identity is confirmed enough to keep the conversation alive.",
    "body": "What has you open to selling it now instead of holding onto it?\n\nWhat matters more to you right now: trying for the highest possible retail price with a listing, or getting a cleaner cash sale without the wait, agent fees, and back-and-forth?\n\nIf the number made sense, are you looking to close soon, or just testing the waters?",
    "notes": [
      "The goal is diagnosis, not pressure.",
      "If the owner wants full retail, route them toward listing or nurture instead of forcing a low cash pitch."
    ]
  },
  {
    "id": "land-owner-net-price-discovery",
    "scope": "deals",
    "label": "Best net price",
    "channel": "Call / SMS",
    "sourceTime": "YPqUHvSAZrU 17:00-19:20",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=1020",
    "title": "Ask for the best net number after framing cash versus retail",
    "when": "Use only after APN/address and basic owner authority/listing status are known.",
    "body": "If I could make this clean for you, cash, close in 2 to 3 weeks if title can support it, cover normal closing costs, and keep it simple, what is the best net number you would seriously consider?\n\nHow did you arrive at that number: nearby sold lots, active listings, what you paid, tax value, or what you need to net?",
    "notes": [
      "Do not promise a seven-day close unless title/escrow can actually support it.",
      "Every number remains subject to correct parcel identity, clean title, access, and buyer/buildability review."
    ]
  },
  {
    "id": "land-owner-low-offer-objection",
    "scope": "deals",
    "label": "Low offer objection",
    "channel": "Call / SMS",
    "sourceTime": "YPqUHvSAZrU 21:54-24:38",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=1314",
    "title": "Answer why the cash number is lower without overexplaining",
    "when": "Use when an owner says the cash offer is too low or asks why it is lower than retail comps.",
    "body": "That is a fair question. You are asking why the cash number is lower than the retail numbers you have seen, right?\n\nMy cash number has to leave room for closing costs, title work, due diligence, access/buildability risk, buyer margin, and resale uncertainty. If you want top retail, listing may be the better route. If you want cleaner certainty and less hassle, that is where my number fits.\n\nAre you looking more for top price, or certainty and speed?",
    "notes": [
      "Name the concern, validate it, then turn it into a question.",
      "If you do not know the answer to a concern, say you will verify it instead of making one up."
    ]
  },

  {
    "id": "land-owner-why-not-retail-route",
    "scope": "deals",
    "label": "Why not retail?",
    "channel": "Call / SMS",
    "sourceTime": "YPqUHvSAZrU 07:30-07:57 / 15:58-16:08",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=450",
    "title": "Ask why the owner wants a direct sale instead of listing for retail",
    "when": "Use when the owner says the lot is worth retail or gives a high number, before arguing comps.",
    "body": "It sounds like a nice lot. Help me understand: why not list it with a Realtor and try for the highest retail price?\n\nIf speed, privacy, or a simpler off-market sale matters more, I can look at it through that lens. If top retail is the main goal, listing may honestly be the better path.",
    "notes": [
      "The video frames seller calls as diagnosis, not pitch pressure.",
      "This supports premium/luxury posture: do not punish high numbers; discover whether the seller wants retail or simplicity."
    ]
  },
  {
    "id": "land-owner-other-lots-and-facts",
    "scope": "deals",
    "label": "Other lots + hidden facts",
    "channel": "Call / SMS",
    "sourceTime": "YPqUHvSAZrU 14:12-14:30",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=852",
    "title": "Ask for listing status, other lots, and undisclosed land facts",
    "when": "Use near the end of land-owner discovery before pricing or follow-up.",
    "body": "Is it currently listed with a Realtor anywhere? If it is, I want to handle it the right way.\n\nDo you have any other lots you are thinking about selling? And is there anything about this property I should know before I price it: access, utilities, flood, wetlands, HOA, liens, title, or anything unusual?",
    "notes": [
      "Source video specifically calls out asking whether it is listed, whether they have other lots, and what else the operator needs to know.",
      "Do not bypass an active listing relationship."
    ]
  },
  {
    "id": "land-owner-written-offer-followup",
    "scope": "deals",
    "label": "Written offer follow-up",
    "channel": "SMS / Email / Mail",
    "sourceTime": "YPqUHvSAZrU 26:28-29:40",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=1588",
    "title": "Send a written offer and keep the 30-day follow-up alive",
    "when": "Use after a qualified owner conversation where APN/owner/parcel facts are known enough to price.",
    "body": "{{ownerFirstName}}, I reviewed the parcel and public records. Assuming clean title, correct APN, legal access, and my buyer side is comfortable after normal review, I could be around {{offerAmount}} net to you.\n\nI would cover normal closing costs, no agent fees if it is off-market, and we can close through title/escrow. If there is a number close enough around there, let us hop on a quick call and talk it through.",
    "notes": [
      "The source video says every seller conversation should get an offer or follow-up.",
      "If the row is not qualified, send an APN/authority/proof clarification instead of a fake offer."
    ]
  },
  {
    "id": "land-tax-deed-auction-owner-opener",
    "scope": "deals",
    "label": "Tax auction owner opener",
    "channel": "SMS / Call",
    "sourceTime": "7u4FpBF6ao8 transcript lines 431-451",
    "sourceUrl": "https://youtu.be/7u4FpBF6ao8",
    "title": "Open with the upcoming auction pressure without sounding predatory",
    "when": "Use only on source-backed tax deed / delinquent auction rows where the upcoming auction status is verified.",
    "body": "Hello {{ownerFirstName}}, I noticed your land is scheduled for the upcoming {{county}} tax auction. What were your plans with it?\n\nIf you are open to selling before it goes that far, I may be able to pay the back taxes, cover normal closing costs, and put some cash in your pocket, subject to title, parcel, and buyer review.",
    "notes": [
      "The tax deed video stresses a separate CRM campaign for these owners.",
      "Use only when auction status, county, parcel, and owner identity are verified from public sources."
    ]
  },
  {
    "id": "land-tax-deed-urgency-title-study",
    "scope": "deals",
    "label": "Auction urgency frame",
    "channel": "Call / SMS",
    "sourceTime": "7u4FpBF6ao8 transcript lines 388-418 / 580-597",
    "sourceUrl": "https://youtu.be/7u4FpBF6ao8",
    "title": "Explain why you need time before the auction date",
    "when": "Use when an auction is less than a few weeks away and the owner asks why speed matters.",
    "body": "Because the auction date is coming up, I need enough time for title/escrow to check the file, confirm the taxes and liens, and let my buyer side review the parcel. If we wait too close to the auction, there may not be enough time to close safely before the deadline.\n\nIf you want me to look at it, I need the APN or parcel link and your best net number today.",
    "notes": [
      "The source video recommends giving yourself at least two weeks where possible.",
      "Do not promise to stop an auction unless closing logistics, title, and tax payoff timing are verified."
    ]
  },
  {
    "id": "land-owner-complete-call-skeleton",
    "scope": "deals",
    "label": "Complete owner call",
    "channel": "Call",
    "sourceTime": "YPqUHvSAZrU compiled from 03:10-29:40",
    "sourceUrl": "https://youtu.be/YPqUHvSAZrU?t=190",
    "title": "Full seller call skeleton for land owners",
    "when": "Use as the full phone path once a land owner is live and willing to talk.",
    "body": "Hey {{ownerFirstName}}, this is {{yourName}}. Thanks for getting back to me.\n\nSounds like I may have caught you in the middle of something. Is now okay for a few quick questions, or should I text you?\n\nI am looking at land around {{market}}, and I work with builders/investors who buy clean lots when the numbers make sense. I want to verify the parcel, understand what you are hoping to do, then check county/GIS records and see if there is a real number I can stand behind. If it is not a fit, no pressure.\n\n1. What is the APN or address/nearest road?\n2. Is this one parcel or multiple parcels?\n3. About how big is it?\n4. Are you the owner on title, or is it family, LLC, trust, or estate?\n5. Is it currently listed with an agent anywhere?\n6. Any known access, utility, flood, wetland, easement, HOA, or title issues?\n7. Any improvements like clearing, driveway, culvert, survey, perc, septic, well, water meter, electric, or plans?\n8. What has you open to selling now instead of holding it?\n9. Are you looking for top retail, or would a cleaner cash sale with less hassle matter more?\n10. If the number made sense, how soon would you want to close?\n11. If I could do cash, close in 2 to 3 weeks, cover normal closing costs, and keep it simple, what is the best net number you would seriously consider?\n12. How did you arrive at that number?\n\nGot it. I will verify the parcel and public records. If it fits, I will send you a real number. If we are close enough, let us hop on a quick call and talk it through.",
    "notes": [
      "This is the LandFlip-normalized version of the Joe McCall seller-call script bank.",
      "Every offer is conditional on parcel identity, title, legal access, buyer fit, and buildability review."
    ]
  },
  {
    "id": "tax-deed-owner-redeem-sell-let-go-opener",
    "scope": "tax-deed",
    "label": "Owner redeem/sell opener",
    "channel": "Call / SMS",
    "sourceTime": "User-supplied tax deed owner script 2026-07-23",
    "sourceUrl": "local://user-provided-tax-deed-page-redesign",
    "title": "Ask the owner whether they plan to redeem, sell, or let the auction happen",
    "when": "Use only on verified tax deed auction owner rows with source-backed county, parcel/APN, owner identity, auction date/status, and payoff/title review pending.",
    "body": "Hey [Name], I saw your lot is scheduled for an upcoming tax deed auction in [County]. Were you planning to redeem it, sell it, or let it go?\n\nI may be able to pay the back taxes through closing and put some cash in your pocket before the auction date. I’d just need to verify the payoff, title, and whether my buyer side is comfortable with the lot. Are you open to a quick call?",
    "notes": [
      "Do not claim the auction can be stopped until payoff, title, closing timing, and county process are verified.",
      "Do not start seller outreach from public owner records until contact provenance is enriched."
    ]
  },
  {
    "id": "pa-upset-sale-owner-sms-straightforward-risk-aware",
    "scope": "tax-deed",
    "label": "PA upset-sale SMS",
    "channel": "SMS",
    "sourceTime": "PA/York upset-sale owner runway 2026-07-23",
    "sourceUrl": "local://pennsylvania-upset-sale-vacant-owner-sourcing",
    "title": "Straight PA upset-sale owner opener with risk-aware wording",
    "when": "Use only after the York/PA tax-claim row, owner, parcel/APN, lot size, delinquent status, and lawful contact path are verified; do not use on raw public-owner rows without skip-trace/contact provenance.",
    "body": "Hi {{ownerFirstName}}, I’m looking at the public tax-claim/parcel records for your vacant lot at {{propertyAddressOrApn}} in {{county}} County. Were you planning to catch up the taxes, sell it, or just let the county process run?\n\nIf selling is worth discussing, I can review the payoff, title/liens, lot access/utilities, and buyer fit and see if there’s a simple cash number that still leaves you better than letting it go. Open to a quick call?",
    "notes": [
      "Pennsylvania upset sales can be subject to mortgages, municipal claims, judgments, liens, and other encumbrances; do not say clean title or guarantee payoff solves everything.",
      "Do not present tax-claim/vacant-screen candidates as scheduled auction lots until Tax Claim confirms sale eligibility and date.",
      "Keep phone/email blank in the owner runway until verified by skip trace, public business/contact source, or owner response."
    ]
  },
  {
    "id": "pa-upset-sale-owner-email-simple-review",
    "scope": "tax-deed",
    "label": "PA upset-sale email",
    "channel": "Email",
    "sourceTime": "PA/York upset-sale owner runway 2026-07-23",
    "sourceUrl": "local://pennsylvania-upset-sale-vacant-owner-sourcing",
    "title": "Short PA upset-sale email: taxes, title risk, and simple sale",
    "when": "Use after owner email is verified and the PA tax-claim/parcel facts have been checked against official county sources.",
    "body": "Subject: {{propertyAddressOrApn}} - vacant lot question\n\nHi {{ownerFirstName}},\n\nI’m reaching out about the vacant lot tied to {{propertyAddressOrApn}} in {{county}} County. I saw it in public tax-claim/parcel records and wanted to ask directly: are you planning to catch up the taxes, sell the lot, or let the county process continue?\n\nIf you are open to selling, I can look at the tax payoff, title/liens, access/utilities, and buyer fit before giving you any number. Pennsylvania upset-sale files can have extra risks, so I would keep it straightforward and only move forward if the records check out.\n\nIf you want me to review it, reply with the best number to reach you and whether you are the person authorized to sell.\n\nThanks,\n{{yourName}}",
    "notes": [
      "Use verified email only; do not enrich or invent seller contacts inside active owner queues.",
      "This copy is intentionally not foreclosure-rescue/legal-advice language; it asks for plans and offers a conditional review.",
      "Require APN/property, authority to sell, payoff, title/liens, and buyer fit before any offer."
    ]
  },
  {
    "id": "closing-feasibility-termination-email-clean",
    "scope": "closing",
    "label": "Clean feasibility termination",
    "channel": "Email",
    "sourceTime": "_1DziIwKyGk transcript notes: risk control / feasibility period",
    "sourceUrl": "https://youtu.be/_1DziIwKyGk",
    "title": "Terminate under feasibility review without saying buyer search failed",
    "when": "Use on Closing when a seller agreement must be terminated during the attorney/title-approved feasibility or due-diligence window.",
    "body": "Subject: {{propertyAddressOrApn}} - Feasibility review update\n\nHi {{sellerFirstName}},\n\nAfter completing our feasibility review on {{propertyAddressOrApn}}, we are not going to be able to move forward with the purchase. Per the feasibility/due-diligence provision in our agreement, this email serves as written notice that we are terminating the contract.\n\nI appreciate your time and the opportunity to review the property. I am sorry we could not make this one work.\n\nThank you,\n{{yourName}}",
    "notes": [
      "Use the contract's feasibility/due-diligence provision, not the phrase 'we could not find a buyer.'",
      "Send only within the valid notice window and keep a copy in the closing file.",
      "Attorney/title review controls final legal wording."
    ]
  },
  {
    "id": "closing-feasibility-termination-email-warm",
    "scope": "closing",
    "label": "Warm feasibility termination",
    "channel": "Email",
    "sourceTime": "_1DziIwKyGk transcript notes: risk control / termination email",
    "sourceUrl": "https://youtu.be/_1DziIwKyGk",
    "title": "Warmer termination when seller relationship matters",
    "when": "Use on Closing for premium, relationship-sensitive, or future-nurture sellers when the deal fails feasibility/title/buildability/buyer-fit review.",
    "body": "Subject: {{propertyAddressOrApn}} - Update on our review\n\nHi {{sellerFirstName}},\n\nI wanted to follow up after reviewing {{propertyAddressOrApn}}. Unfortunately, after our feasibility review, we are not going to be able to move forward with the purchase. There are a few items on our side that keep it from being a fit, so under the due-diligence/feasibility period in our agreement, we will need to terminate the contract.\n\nI appreciate you working with us, and I am sorry we could not get this one across the line.\n\nThank you,\n{{yourName}}",
    "notes": [
      "Best for sellers where tone matters: respectful, early, and not over-explained.",
      "Do not cite unverified defects or expose buyer boxes, buyer max, or assignment spread.",
      "Use only when the seller agreement actually contains a termination right that still applies."
    ]
  }
];
