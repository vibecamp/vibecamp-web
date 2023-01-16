
export type Page = {
    page_id: string,
    title: string,
    content: string,
    visibility_level: VisibilityLevel,
    nav_order: number | null
}

export const VISIBILITY_LEVELS = ['public', 'applicants', 'ticket_holders', 'admins'] as const
export type VisibilityLevel = typeof VISIBILITY_LEVELS[number]

export async function getPublicPages(): Promise<readonly Page[]> {
    return [
        {
            page_id: "",
            title: "vibecamp",
            content: '## WHY VIBECAMP?\nSuccessful beyond our wildest dreams, vibecamp is the yearly mini festival we memed into existence.\n\n2020’s lockdowns affected everyone, challenging our standing routines of being social, thoughtful, and active in the world. Many of us directed our unused energy online, forging new connections and friendships, and finding communities to be part of across the internet. Our corner of Twitter has somehow become the intersection of hundreds or thousands of these people and communities, sharing our ideas, humor, and goodwill with one another no matter where we are in the world. \n\nWhile interacting on Twitter or Discord is delightful, all along we’ve looked forward to the chance to get to know each other in person. As lockdowns end and travel resumes, many of us have been able to do just that, cementing what were just internet friendships in the real world. We’ve realized that the energy and excitement of this community isn’t just a product of pandemic loneliness, and we really do have the potential to do amazing things! We just need a reason to come together. \n\nvibecamp is that reason. We recognized that nothing was standing in the way of creating an event that would multiply the creative energy, excitement, and joy that our diverse and far-flung online community sparks in all of us. Of course, we also want to throw a big party. But this is a party with a purpose, for celebrating our community in its entirety, and there’s no better way than to highlight the diverse subgroups that make sharing Twitter with one another so weird and fun. \n\nThere are no definitions for who belongs at vibecamp. There are no clear boundaries for the membership of ingroup. There is only the constant, undeniable sense of a community disorganized around collective appreciation of our separate, special uniqueness. At vibecamp, we will explore what that means, and share what we all can bring to the table. We can’t wait to see you there.\n\nSubscribe to our mailing list and follow @vibecamp_ on Twitter to stay informed on ticket sales and other cool stuff.',
            visibility_level: 'public',
            nav_order: 1,
        },
        {
            page_id: 'communityvalues',
            title: "Community Values",
            content: '## COMMUNITY VALUES\nWe don’t generally like rules governing behavior, but we’re aware that it’s up to the organizing team to set the tone for vibecamp.\n\nBeyond ‘just vibe, bro’, here are a few things we wanted to tell y’all:\n\nLargely, identifying misconduct will be at the discretion of the org team. We will have people wearing t-shirts marked ‘fae’ onsite who will escalate issues to the org team if necessary. We, the vibecamp org team, reserve the right to ask anyone to leave vibecamp without a refund if we feel it is an appropriate step to take.\n\n### Things that we will have zero tolerance for include:\n\n- acts of physical or sexual assualt (enthusiastic consent and the safety of attendees is VERY important to us)\n- publicly doxxing the names of pseudonymous attendees (don’t be a dick)\n- taking and posting photographs/videos/speech that contain people who have not consented to such (again-don’t be a dick, people)\nBy default, respect attendees’ anonymity – don’t take or post pics/videos/transcripts and don’t name or imply names unless everyone involved is on board with you doing so. The Chatham House Rule is a great one for this community – You can talk about what was said or what happened, but don’t make it easy to tell who said/did what unless you have explicit consent. Please don\'t mention Camp Champions in your tweets – only tag @vibecamp_. Oh, and also NO DRUGS! \n\nvibecamp is our baby. We’ve collectively spent hundreds – probably thousands – of hours working to bring this vision to life. We want to be able to hang out with friends old and new, and have a great time together! If any attendees are acting in a way that makes you uncomfortable, please don’t hesitate to bring it to our attention directly, or to a fae volunteer who can contact us. We won’t be able to be everywhere at once and we will do what we can to make this a space where we can all be comfortable in our unique selves.\n\n### So what is it that we do want to see there?\n\nYOU, in all of your glorious weirdness. Wear costumes (or don’t)! Make art! Play, talk, dance, meet new people! Touch grass! Curiosity and kindness are values we stan. We will have a crazy range of viewpoints and political leanings represented among attendees. This is a perfect opportunity to let go of what artificially divides us and meet one another as humans.\n\n### It’s hard to put a finger on our exact values as a community, because we are so diverse and illegible, but here’s our short list:\n\n- participation rather than spectatorship\n- fulfilling conversations\n- illegibility and the ability to go meta\n- gentle, friendly pranksterishness\n- building an IRL home for ingroup\n- using social media to connect people who wouldn’t have met otherwise\n- personal and collective growth\n- deep, meaningful connection\n\nWhile we’re not totally sure what form(s) vibecamp will take over time, we’re sure of a few things. vibecamp is far more than just a bunch of internet strangers getting together for the first time at scale – it is the fulfillment of a dream, a crucial next step along the path towards a better future. We have such incredible people in this community, so much creativity, passion, and talent. Fostering connections between all of us means creating the conditions necessary for amazing people to get together to share thoughts and ideas and begin planning even greater endeavors together.\n\nIn the fullness of time we envision vibecamp moving around the world, spawning regional weekend get-togethers that happen more than once a year, and perhaps eventually culminating in purchasing land for a central event location year round. Stay tuned! Give us feedback! Offer your skills and passion! Create what you want to see! We can’t do it without you.',
            visibility_level: 'public',
            nav_order: 2
        },
        {
            page_id: 'faq',
            title: 'FAQ',
            content: `
## FAQ

### DISCORD

The answer to pretty much any question of "where do I get more information", "where are we organizing this", or "who do I talk to" is in our [Discord Server](https://discord.gg/V6JtaMn7WC)!

[How do I purchase a ticket?](#how-do-i-purchase-a-ticket)

[Where?](#where)

[How much does it cost?](/faq/#howmuch)

When?

How do we get there?

I want to come but I can't afford a ticket!
Can I bring friends?
How long do I have to purchase tickets?
Refunds?
Who is going to vibecamp?
How's data coverage?
Wifi?
Waivers?
Can I stay in my tent/RV/car?
Can I bunk with my friends?
Can I bring my bicycle?
Will meals be provided?
What if I have special dietary needs?
Can I bring my own food?
Onsite lockers?
Are bedding, towels, and toiletries provided?
Can I bring my child?
How big are the cabins?
STUFF TO BRING
Are pets allowed?
Can I play music all night long?
Who do I look to for help during vibecamp?
How do I contribute to vibecamp?
Why are tickets more expensive than at the first vibecamp?

## WHERE / WHEN / WHO / HOW
### How do I purchase a ticket?
Check out this twitter thread for all the details: https://twitter.com/vibecamp_/status/1568027189005926400?s=20&t=sGe8LkxoBC3rCBY7RUBepQ
Bottom line is that you need to fill out this survey: https://forms.gle/MG8on9FMLh8hw6bk7

### How does ticket allocation work?
Ticket allocation is a 3 stage process. 
Phase 1: The first 150 people to fill out the application were sent ticket purchase links. This phase is over! 
Phase 2: On December 1st we ran a lottery for all the applicants that did not make it in time for the 1st phase. 150 people were sent ticket purchase links. This phase is over! 
Phase 3: All remaining applications shall be reviewed by the HIGH COUNCIL. If your application PLEASES the HIGH COUNCIL you shall be granted access. If it DISPLEASES the HIGH COUNCIL you shall be hunted down and sacrificed to the VIBE GODS. This is the current phase! 
Sponsorships: Financial aid is granted on a first-come-first-serve basis. Financial aid is capped at 80 tickets. We may increase this cap in the future. People who have requested financial aid but were not approved will still have a chance to get a ticket purchase link during phase 3.

### Where?
A gorgeous mixed-use site in Maryland, USA. The exact address will be given as we approach the event.

### How much does it cost?

#### Adults and children 9 & older
General admission is $420.69 because we were born of memes and to memes we shall return.  This tier gives you access to the event/activities and covers two meals a day (snacks provided). Your entry pass will allow you to camp in your tent on the grounds, sleep in your car, pass out on the grass, or try and find a cuddle buddy to keep you warm at night.

A cabin ticket is $590. This tier grants you access to everything listed above, AND guarantees you a bed on a tempurpedic mattress in one of the many cabins. Bring your own bedding/sleeping bag/pillow!

Final Night Celebration tier is $140. This ticket tier gives you event access and food for the final night of the event. You'll check-in on Saturday between 2pm and 6pm and stay the remainder of vibecamp.

#### Kids 8 and under
$210 for a basic ticket
$380 for a bed in a cabin

Kids 2 and under are free!

All tickets include food.

### When?
June 15th-18th 2023

### How do we get there?
Ramblewood is near two major cities; Baltimore and Philadelphia. We may be facilitating transportation. Check back for more details as we get closer to the event.

### I want to come but I can't afford a ticket!
We're carrying forward our sponsorship program; please indicate your desire for financial assistance when you fill out the survey

### Can I bring friends?
Though you may only purchase your own ticket, anyone can apply to come to vibecamp!

### How long do I have to purchase tickets?
Your ticket purchase link is good while supplies last. It is not a guarantee to a ticket.

### Refunds?
Ticket sales are final. No refunds or cancellations are available.

### Who is going to vibecamp?
Capacity is limited to 800 people for 2023. At the first vibecamp, attendees came mostly from a loose connection of networks on twitter. This included rats, postrats, EAs, burners, tech bros of various stripes, lurkers and people who had never heard of any of those things. The attendees at the first vibecamp were overwhelmingly open, kind, and just downright pleasant to be around. We anticipate that many of those who joined us for the first event will be returning for the second one -- and look forward to the opportunity to make so many more new friends!

### What will happen at vibecamp?
Content and events hosted by both the organizers and attendees like you. As we approach the event we will communicate some of the events you can expect to see.

## ACCOMMODATIONS
### Power Outlets?
Yes! There are plenty of power outlets in each cabin as well as at the various other buildings.

### How's data coverage?
Pretty good! Most major carriers have decent coverage there.

### Wifi?
High speed wifi is available on an as-needed basis. Contact a volunteer or member of the org team to get access.


### Waivers?
TBD. Follow us on Twitter at @vibecamp_ or join our discord to keep up to date.

### Can I stay in my tent/RV/car?
Yep!

Can I bunk with my friends?
Yes! Checkout the communities channels on our discord.

Can I bring my bicycle?
Yep! Just make sure to bring a lock!

Will meals be provided?
Yes! The following meals will be provided by on-site services: Thursday dinner, Friday brunch, Friday dinner, Saturday brunch, Saturday dinner, Sunday brunch. Attendees holding single night tickets will be provided Saturday dinner and Sunday brunch. We  plan to organize snacks/light breakfast food for early risers as well.

What if I have special dietary needs?
If you’ve purchased a ticket already contact Colby by dming him on twitter (@zerothaxiom) or emailing him (colby@vibecamp.xyz).

Can I bring my own food?
Absolutely! And even better - at this venue you are allowed to cook it yourself!

Onsite lockers?
Nope!

Are bedding, towels, and toiletries provided?
Bare mattresses are provided in the cabins, and the bathrooms all have toilet paper and soap dispensers next to the sinks.

Can I bring my child?
Yep! See “how much will it cost?” to see child ticket prices. Childcare will not be provided.

How big are the cabins?
The cabins are of various sizes.
There are 13 cabins with 7 beds. 2 with 8 beds. 16 with 10 beds. 2 with 12 beds. 4 with 13 beds. 1 with 19 beds. and 1 with 27 beds. We may be reserving a few of these cabins for special purposes.

STUFF TO BRING

Clothes for 4 days and 3 nights.
A fabulous outfit (or three) for our dance parties
Swim gear
Your own towel for swimming and showering
Flip flops for the showers
Toiletries, including sunblock and bug spray
Bedding/sleeping bag/pillow.
A water bottle.
Gifts/schwag/activities/things to share with your friends
~vibes~
OTHER


Are pets allowed?
Only licensed service dogs.

Can I play music all night long?
There are no official rules for noise at this venue, but if it’s getting late and you’re bothering other vibers, we will ask you to quiet down.

Who do I look to for help during vibecamp?
We will have volunteers on site that will be the point of contact for questions about events or the site, or if you need to contact an organizer  about something more serious. PLEASE report harmful behavior  directly to one of the organizers IMMEDIATELY. We  will have plans in place to respond to issues, but cannot do so if we do not know they are happening.  There will be a single point of contact for interpersonal/community issues and we will  make sure everyone knows how to contact them  to share anonymous complaints as we draw closer to the event.

How do I contribute to vibecamp?
Do a project or bring content! At the first vibecamp attendees organized art sessions, board games, circling, workshops, dancing, and more. We will soon have a form for you to fill out, letting us know what you want to do at vibecamp. Colby (@zerothaxiom, colby@vibecamp.xyz) will help you figure out a time and place for your project. Additionally, you can be a volunteer. If you’ve already filled out this form and indicated your interest in volunteering then we may be contacting you about volunteer duty.   We also have a donation field on the ticketing page specifically to go into a fund to help sponsor low income attendees, and will be starting a crowdfunding campaign soon to help support the organization as whole.

Why are tickets more expensive than at the first vibecamp?
This event includes a whole extra day! The next vibecamp will also be much larger and require a lot more work from the team as well as more resources, EG: portable toilets- plus the org team has some fun surprises planned for attendees we think you’ll be pretty excited about. Ticket prices were so low for the first vibecamp because we didn’t budget in any payments for the people working full or part time on the event.  In order for the event to remain the cool, vision-driven project it has been so far and not have strings attached by outside investors, we needed to bring prices up a bit. We’ll still be working to get as many low-income  people access as we can manage.

COMMUNITY VALUES

We don’t like rules governing behavior, but we’re aware that it’s up to the organizing team to set the tone for vibecamp.

Beyond ‘just vibe, bro’, here are a few things we wanted to tell y’all:

Largely, identifying misconduct will be at the discretion of the org team. We will have people marked as ‘fae’ onsite in shifts that will escalate issues to the org team if necessary. We, the vibecamp org team, reserve the right to ask anyone to leave vibecamp without a refund if we feel it is an appropriate step to take.

Things that we will have zero tolerance for include:

acts of physical or sexual assault (the safety of attendees is VERY important to us)
publicly doxxing the names of psuedonymous attendees (don’t be a dick)
posting photographs/videos/speech that contain people who have not consented to such (again-don’t be a dick, people)
By default, don’t post pics/videos/transcipts and don’t name/imply names unless everyone involved is on board with you doing so. The Chatham House Rule is a great one for this community – you can talk about what was said or what happened, but can’t name names or make it easy to tell who said/did what unless you have explicit consent. Please take a look at our ToS for explicit rules we’re putting in place moving forward.

Vibecamp is our baby. We’ve collectively spent thousands of hours working to bring this vision to life. We want to be able to hang out with friends old and new, and have a great time together! If any attendees are acting in a way that makes you uncomfortable, please don’t hesitate to bring it to our attention directly, or to a fae volunteer who can contact us. We won’t be able to be everywhere at once and we will do what we can to make this a space where we can all be comfortable in our unique selves.

So what is it that we do want to see there?

YOU, in all of your glorious weirdness. Wear costumes (or don’t)! Make art! Play, talk, dance, meet new people! Touch grass! Curiosity and kindness are values we stan. We will have a crazy range of viewpoints and political leanings represented among attendees. This is a perfect opportunity to let go of what artificially divides us and meet one another as humans.

It’s hard to put a finger on our values as a community, because we are so diverse, but here’s our short list:

participation rather than spectatorship
fulfilling conversations
illegibility and the ability to go meta
gentle, friendly pranksterishness
building an IRL home for ingroup
using social media to connect people who wouldn’t have met otherwise
personal and collective growth
deep, meaningful connection
vibecamp is far more than just a bunch of internet strangers getting together at scale – it is the fulfillment of a dream, a crucial next step along the path towards a better future. We have such incredible people in this community, so much creativity, passion, and talent. Fostering connections between all of us means creating the conditions necessary for amazing people to get together to share thoughts and ideas and begin planning even greater endeavors together.

In the fullness of time we envision vibecamp moving around the world, spawning regional weekend get-togethers that happen more than once a year, and perhaps eventually culminating in purchasing land for a central event location year round. Stay tuned! Give us feedback! Offer your skills and passion! Create what you want to see! We can’t do it without you.`,
            visibility_level: 'public',
            nav_order: 3
        }
    ]
}