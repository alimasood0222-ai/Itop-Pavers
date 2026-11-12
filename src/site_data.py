"""Single source of truth for iTOP Pavers content.

build.py renders BOTH the visible HTML and the JSON-LD from this file, so the
NAP, service names and town list can never drift apart.

Rules (see CLAUDE.md / docs/seo/plan.md):
- Only state confirmed facts or the client's own published wording (old itoppavers.com, marked "old site").
- Anything unknown is a TODO(client) comment, never a guess.
- Never show the Google review count (user request 2026-11-12).
"""

SITE_URL = 'https://itoppavers.com'          # TODO(client): confirm bare domain vs www (default: bare, www -> 301)

BIZ = {
    'name': 'iTOP Pavers',
    'legal_name': 'iTop Pavers LLC',          # old site Privacy/Cookie/Terms
    'phone': '(904) 525-9191',
    'phone_e164': '+19045259191',
    'email': 'info@itoppavers.com',
    'street': '6510 Columbia Park Dr, Suite 206',
    'city': 'Jacksonville', 'region': 'FL', 'zip': '32258', 'country': 'US',
    'licence': 'CBC 1294954',
    'experience': '10+ years',
    'days': 'Mon–Fri 8 am–6 pm · Sat 9 am–1 pm',   # confirmed by the user 2026-11-12
    'hours': [('Mon–Fri', '8:00 am – 6:00 pm'), ('Saturday', '9:00 am – 1:00 pm'), ('Sunday', 'Closed')],
    'hours_spec': [(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], '08:00', '18:00'), (['Saturday'], '09:00', '13:00')],
    'instagram': 'https://www.instagram.com/itoppavers/',
    'facebook': 'https://www.facebook.com/itoppavers/',   # page is titled "ITop Builder" - client to rename
    # TODO(client): Google Business Profile URL -> add to sameAs
    # TODO(client): geo coordinates of the office (GBP pin) -> schema geo
    # TODO(client): founding year -> foundingDate
    'manager': 'Fabio Hesteferson',           # TODO(client): spelling (old site also shows "Hesterferson")
    'slogan': 'Crafting unique home solutions',
    'google_reviews': 'https://www.google.com/search?q=iTOP+Pavers+Jacksonville+reviews',  # TODO(client): direct GBP review link
}
ADDRESS_ONE_LINE = f"{BIZ['street']}, {BIZ['city']}, {BIZ['region']} {BIZ['zip']}"

# Service area: identical on the page, the map and in the schema.
# TODO(client): confirm the list. The old FAQ listed 22 places (incl. Ocala, Palatka, Palm Coast, Yulee); the map shows these 12.
TOWNS = [  # name, lat, lon, label always visible, label side
    ('Jacksonville', 30.332, -81.656, 1, 'r'), ('Fernandina Beach', 30.669, -81.462, 1, 'r'),
    ('Atlantic Beach', 30.334, -81.399, 0, 'r'), ('Neptune Beach', 30.312, -81.396, 0, 'r'),
    ('Jacksonville Beach', 30.288, -81.393, 1, 'r'), ('Ponte Vedra Beach', 30.240, -81.386, 1, 'r'),
    ('Nocatee', 30.105, -81.420, 1, 'r'), ('St. Johns', 30.081, -81.548, 1, 'r'),
    ('Fruit Cove', 30.111, -81.642, 0, 'l'), ('Orange Park', 30.166, -81.706, 1, 'l'),
    ('Fleming Island', 30.093, -81.719, 0, 'l'), ('St. Augustine', 29.895, -81.315, 1, 'r'),
]
COUNTIES = ['Duval County', 'St. Johns County', 'Clay County', 'Nassau County']
TOWN_NAMES = [t[0] for t in TOWNS]
OFFICE_LL = (30.19, -81.565)                  # approximate, for the schematic map only (not used in schema)

# ---------------------------------------------------------------- services
PAVER_PROCESS = [  # old site: "Our ... Installation Process"
    ('Consultation', 'We listen to your vision and help choose the right pavers for your space.'),
    ('Site prep', 'We clear, excavate and level the area for a strong, lasting foundation.'),
    ('Expert installation', 'Each paver is laid with precision for a clean, durable finish.'),
    ('Final touches', 'We secure the edges, seal the joints and inspect every detail.'),
]
LIVING_PROCESS = [
    ('Consultation', 'We visit, measure and talk through how you want to use the space.'),
    ('Design & approvals', 'We plan the layout and take care of HOA, engineering and permit approvals.'),
    ('Build', 'Our crew builds it with durable materials chosen for Florida weather.'),
    ('Walkthrough', 'We inspect every detail with you before we call it finished.'),
]

SERVICES = [
  {
    'slug': 'patios', 'name': 'Paver Patios', 'nav': 'Patios', 'group': 'Pavers', 'type': 'Patio', 'img': 'patio-firepit-lake', 'icon': 's-patio',
    'card': 'Gathering space with clean borders and lasting base work.',
    'title': 'Paver Patios in Jacksonville, FL | iTOP Pavers',
    'desc': 'Custom paver patios across Jacksonville, St. Augustine and St. Johns County. Licensed contractor CBC 1294954. Free on-site estimate: (904) 525-9191.',
    'h1': 'Paver patios in Jacksonville & St. Johns County',
    'answer': 'iTOP Pavers designs and builds custom paver patios across Jacksonville, St. Augustine and St. Johns County. Every patio starts with a compacted stone base and edge restraint, so it stays flat through Florida summers, and is finished in the pattern, colour and border you choose. Estimates are free.',
    'included': ['Design help with pattern, colour and border', 'Excavation and a compacted, layered stone base', 'Pavers laid to pattern with edge restraint', 'Polymeric joint sand, and sealing on request', 'Fire pits, seat walls and steps built in'],
    'why': [('Design options', 'Custom designs tailored to your style and space.'), ('Quality material', 'Durable materials that withstand Florida’s weather.'), ('Minimum upkeep', 'Low-maintenance, long-lasting construction.'), ('Hassle-free', 'A seamless process from design to installation.')],
    'faqs': [
      ('What is the best paver pattern for a patio?', 'It depends on the look and the space. Herringbone gives the strongest interlock and suits busy patios, running bond feels clean and calm, and basketweave adds a traditional texture. iTOP Pavers walks you through the options at your free consultation and shows them on your layout.'),
      ('Can my patio include a fire pit or seat wall?', 'Yes. iTOP Pavers builds fire pits, seat walls and retaining walls in matching block, so they can be designed into the patio from the start rather than added later. See our lakeside fire pit project for an example.'),
      ('How do you stop a paver patio from sinking?', 'Settling is a base problem, not a paver problem. We dig out and compact the subgrade, add geotextile fabric, build a compacted crushed-stone base in layers, screed a level sand bed, then lock the pavers in with edge restraint and polymeric joint sand.'),
      ('How long does a paver patio take to build?', 'It depends on the size, site access and any HOA or permit approval. iTOP Pavers gives you a schedule with your written estimate before work begins.'),  # TODO(client): typical duration range
    ],
  },
  {
    'slug': 'driveways', 'name': 'Paver Driveways', 'nav': 'Driveways', 'group': 'Pavers', 'type': 'Driveway', 'img': 'driveway-curved', 'icon': 's-drive',
    'card': 'Interlocking pavers rated for daily vehicle loads.',
    'title': 'Paver Driveways in Jacksonville, FL | iTOP Pavers',
    'desc': 'Paver driveway installation in Jacksonville and St. Johns County: deep compacted base, strong interlock, custom borders. Free estimate: (904) 525-9191.',
    'h1': 'Paver driveways in Jacksonville & St. Johns County',
    'answer': 'iTOP Pavers installs paver driveways across Jacksonville, St. Augustine and St. Johns County. We build a deeper compacted stone base for vehicle loads, lay the pavers in an interlocking pattern that resists shifting, and finish with a clean border, so the driveway stays strong and good-looking for years.',
    'included': ['Layout and pattern advice for vehicle traffic', 'Excavation and a compacted base sized for cars', 'Interlocking pavers with a soldier-course border', 'Joint sand, and sealing on request', 'Matching walkways and entry steps'],
    'why': [('Custom design', 'Designs that match your home’s style.'), ('Lasting durability', 'High-quality pavers built for daily traffic.'), ('Minimum upkeep', 'Low-maintenance, long-lasting construction.'), ('Hassle-free', 'We make your driveway upgrade simple and stress-free.')],
    'faqs': [
      ('Are pavers strong enough for a driveway?', 'Yes. Interlocking concrete pavers on a properly compacted stone base carry everyday vehicle loads well, and because they are individual units they flex with the ground instead of cracking across a slab. A damaged paver can be lifted and replaced.'),
      ('Which paver pattern is best for a driveway?', 'Herringbone, laid at 45° or 90°, is the usual choice for driveways because it has the strongest interlock and resists the twisting force of turning tyres. iTOP Pavers recommends a pattern based on how your driveway is used.'),
      ('Can my driveway have a contrasting border?', 'Yes. A soldier-course border in a contrasting colour, such as charcoal around a lighter field, frames the driveway and helps hold the edge. Several of our recent driveways use one.'),
      ('What maintenance does a paver driveway need?', 'Very little: occasional cleaning, topping up joint sand and resealing when the surface needs it. iTOP Pavers offers paving maintenance, including deep cleaning, joint stabilisation, sealing and minor repairs.'),
    ],
  },
  {
    'slug': 'pool-decks', 'name': 'Pool Decks', 'nav': 'Pool decks', 'group': 'Pavers', 'type': 'Pool deck', 'img': 'pool-deck', 'icon': 's-pool',
    'card': 'Light, slip-resistant surfaces around the water.',
    'title': 'Paver Pool Decks in Jacksonville & St. Augustine | iTOP',
    'desc': 'Paver and travertine pool decks in Jacksonville, St. Augustine and St. Johns County. Slip-resistant, cooler surfaces with coping. Free estimate: (904) 525-9191.',
    'h1': 'Pool decks in Jacksonville & St. Augustine',
    'answer': 'iTOP Pavers builds paver and travertine pool decks across Jacksonville, St. Augustine and St. Johns County. We help you choose a light, textured surface that stays cooler and safer underfoot, finish the pool edge with coping, and can build the deck together with a new fiberglass pool or screen enclosure.',
    'included': ['Surface advice: pavers or travertine, colour and texture', 'Compacted base with slope away from the pool and house', 'Bullnose coping around the pool edge', 'Joint sand, and sealing on request', 'Coordination with pool and screen-enclosure work'],
    'why': [('Designed to fit', 'Designs that complement your pool and landscape.'), ('Safety first', 'Slip-resistant materials for safety around water.'), ('Lasting quality', 'Durable, low-maintenance materials built to last.'), ('Hassle-free', 'A seamless process from design to installation.')],
    'faqs': [
      ('What is the best pool deck material in Florida?', 'Concrete pavers and travertine are both popular. Lighter colours stay cooler in the sun and textured finishes improve grip when wet. Pavers offer the most colours and patterns; travertine has a natural-stone look. See our pavers vs concrete vs travertine comparison.'),
      ('Are paver pool decks slippery?', 'Pavers with a textured surface give good grip around water, and a correctly sloped base sends water away rather than letting it pool. iTOP Pavers recommends slip-resistant finishes for every pool deck.'),
      ('Can you add coping around my pool?', 'Yes. We finish the pool edge with bullnose coping that matches or contrasts with the deck, as on our recent pool deck project.'),
      ('Can you build the deck at the same time as a new pool?', 'Yes. iTOP Pavers installs fiberglass pools and builds pool decks, so both can be planned together with one point of contact.'),
    ],
  },
  {
    'slug': 'walkways', 'name': 'Paver Walkways', 'nav': 'Walkways', 'group': 'Pavers', 'type': 'Walkway', 'img': 'front-entry', 'icon': 's-walk',
    'card': 'Paths that connect the front door, garden and backyard.',
    'title': 'Paver Walkways & Entries in Jacksonville | iTOP Pavers',
    'desc': 'Paver walkways, garden paths and front-entry steps in Jacksonville and St. Johns County. Slip-resistant and built to last. Free estimate: (904) 525-9191.',
    'h1': 'Paver walkways & entries in Jacksonville',
    'answer': 'iTOP Pavers builds paver walkways, garden paths and front-entry steps across Jacksonville, St. Augustine and St. Johns County. Each path sits on a compacted base so it stays level, uses slip-resistant pavers for safety, and can be matched to your driveway or patio so the whole property looks connected.',
    'included': ['Path layout from the driveway to the door and backyard', 'Compacted base and edge restraint', 'Curved or straight designs, steps and landings', 'Slip-resistant, weatherproof pavers', 'Matching colours to your driveway or patio'],
    'why': [('Custom design', 'Designs to match your outdoor style.'), ('Safety', 'Slip-resistant, weatherproof materials.'), ('Minimum upkeep', 'Low-maintenance and built to last.'), ('Hassle-free', 'A seamless process from design to installation.')],
    'faqs': [
      ('Can a walkway match my driveway or patio?', 'Yes. We can use the same paver collection and colour, or a complementary border, so the walkway ties the front of the house to the driveway and backyard.'),
      ('Can you build front-entry steps with pavers?', 'Yes. iTOP Pavers builds paver steps and landings, including curved entry steps like those on our front-entry project.'),
      ('Are paver walkways slip-resistant?', 'Textured pavers give good grip in Florida rain, and a level, well-compacted base prevents trip edges from forming over time.'),
      ('Will tree roots or rain move my walkway?', 'A compacted base, edge restraint and polymeric joint sand keep a walkway stable. If a section ever lifts, individual pavers can be removed, the base corrected and the same pavers relaid.'),
    ],
  },
  {
    'slug': 'paving-maintenance', 'name': 'Paving Maintenance', 'nav': 'Paving maintenance', 'group': 'Pavers', 'type': 'Paving maintenance', 'img': 'driveway-terracotta', 'icon': 's-drive',
    'card': 'Cleaning, joint sand, sealing and repairs.',
    'title': 'Paver Sealing & Maintenance in Jacksonville | iTOP Pavers',
    'desc': 'Paver cleaning, sealing, joint sand and repairs in Jacksonville and St. Johns County. Protect colour and stop weeds and shifting. Call (904) 525-9191.',
    'h1': 'Paver sealing & maintenance in Jacksonville',
    'answer': 'iTOP Pavers keeps paver patios, driveways and walkways in top condition across Jacksonville, St. Augustine and St. Johns County. Our maintenance service includes deep cleaning, joint stabilisation, sealing and minor repairs, which protects colour from the Florida sun and helps prevent weeds, stains and shifting pavers.',
    'included': ['Deep cleaning of the paver surface', 'Joint sand replacement and stabilisation', 'Sealing to protect and enhance colour', 'Minor repairs: lifting and resetting sunken pavers', 'Advice on keeping pavers looking new'],
    'why': [('Prevents damage', 'Helps prevent cracks, stains and surface damage.'), ('Better colour', 'Enhances colour and texture with professional sealing.'), ('Saves money', 'Avoids costly repairs later.'), ('Hassle-free', 'One visit, done properly.')],
    'faqs': [
      ('What is included in paver maintenance?', 'iTOP Pavers’ maintenance includes deep cleaning, joint stabilisation, sealing and minor repairs to keep your pavers in top condition.'),
      ('How often should pavers be sealed?', 'It depends on sun exposure, traffic and the sealer used. We look at the surface during the visit and tell you when sealing will actually help.'),  # TODO(client): typical resealing interval
      ('Can you fix sunken or uneven pavers?', 'Yes. Minor repairs are part of the service: we lift the affected pavers, correct the base underneath and relay them, so the area sits level again.'),
      ('Does sealing change how pavers look?', 'Sealing enhances colour and texture and helps protect it from fading in the sun. We can talk through the finish you prefer before we start.'),
    ],
  },
  {
    'slug': 'fiberglass-pools', 'name': 'Fiberglass Pools', 'nav': 'Fiberglass pools', 'group': 'Outdoor Living', 'type': 'Fiberglass pool', 'img': None, 'icon': 's-pool',
    'card': 'Resort-style pools installed with matching decks.',
    'title': 'Fiberglass Pool Installation in Jacksonville | iTOP Pavers',
    'desc': 'Fiberglass pool installation with matching paver decks in Jacksonville and Northeast Florida. Durable, low-maintenance, permits handled. Call (904) 525-9191.',
    'h1': 'Fiberglass pools & decks in Northeast Florida',
    'answer': 'iTOP Pavers installs fiberglass pools for Jacksonville and Northeast Florida homeowners, together with the paver deck, coping and screen enclosure around them. Fiberglass is durable and low-maintenance, and because one team plans the pool and the hardscape, the whole backyard is designed to work as one space.',
    'included': ['Pool selection and placement planning', 'HOA, engineering and permit approvals', 'Fiberglass pool installation', 'Paver or travertine deck with coping', 'Optional screen enclosure and outdoor kitchen'],
    'why': [('Resort living', 'Elegant designs for a backyard you live in.'), ('Low maintenance', 'Durable fiberglass built to last.'), ('Fast installation', 'Fiberglass shells install quickly compared with building a pool on site.'), ('One team', 'Pool, deck and enclosure planned together.')],
    'faqs': [
      ('Why choose a fiberglass pool?', 'Fiberglass pools are durable and low-maintenance, and the factory-made shell installs quickly. iTOP Pavers pairs the pool with a paver deck and coping so it looks finished from day one.'),
      ('Can you build the pool deck and screen enclosure too?', 'Yes. iTOP Pavers builds pool decks and screen enclosures, so the whole project is planned and built with one point of contact.'),
      ('Do you handle permits for a pool?', 'Yes. We take care of HOA, engineering and permit approvals as part of the project.'),
      ('How long does a fiberglass pool installation take?', 'It depends on the pool, site access and permit approval times. You get a schedule with your written estimate.'),  # TODO(client): typical duration
    ],
  },
  {
    'slug': 'outdoor-kitchens', 'name': 'Outdoor Kitchens', 'nav': 'Outdoor kitchens', 'group': 'Outdoor Living', 'type': 'Outdoor kitchen', 'img': None, 'icon': 's-kitchen',
    'card': 'Grills, counters and storage built for Florida weather.',
    'title': 'Outdoor Kitchen Builder in Jacksonville, FL | iTOP Pavers',
    'desc': 'Custom outdoor kitchens in Jacksonville and St. Johns County: counters, grill stations and storage on a paver patio, built for Florida weather. Free estimate.',
    'h1': 'Outdoor kitchens in Jacksonville & St. Johns County',
    'answer': 'iTOP Pavers designs and builds custom outdoor kitchens across Jacksonville, St. Augustine and St. Johns County. We plan the counters, grill station and storage around how you cook and entertain, build them on a solid paver patio with durable materials for Florida weather, and can add a pergola for shade.',
    'included': ['Layout planned around how you cook and entertain', 'Counters, grill station and storage', 'Paver patio or extension underneath', 'Optional pergola for shade', 'HOA and permit approvals handled'],
    'why': [('Custom design', 'Tailored to your style and space.'), ('Built for Florida', 'Durable materials that withstand Florida’s weather.'), ('Minimum upkeep', 'Low-maintenance, long-lasting construction.'), ('Hassle-free', 'A seamless process from design to installation.')],
    'faqs': [
      ('What can an outdoor kitchen include?', 'Most of our outdoor kitchens combine counters, a built-in grill station and storage, planned around how you like to cook and entertain. We design it with the patio so everything fits the space.'),
      ('Can an outdoor kitchen go under a pergola?', 'Yes. iTOP Pavers builds pergolas and gazebos, so shade can be designed over the kitchen and dining area as one project.'),
      ('What materials hold up to Florida weather?', 'We use durable, low-maintenance materials chosen to handle Florida sun, heat and rain, and build on a compacted paver base so the kitchen stays level.'),
      ('Do you run gas, water or electric to the kitchen?', 'Ask us during your consultation and we will explain how utilities are handled for your project.'),  # TODO(client): utilities scope (in-house or partner trades?)
    ],
  },
  {
    'slug': 'pergolas-gazebos', 'name': 'Pergolas & Gazebos', 'nav': 'Pergolas & gazebos', 'group': 'Outdoor Living', 'type': 'Pergola or gazebo', 'img': None, 'icon': 's-pergola',
    'card': 'Shade structures sized to your patio.',
    'title': 'Pergolas & Gazebos in Jacksonville, FL | iTOP Pavers',
    'desc': 'Custom pergolas and gazebos in Jacksonville and St. Johns County. Shade and style for your patio or pool deck, with permits handled. Free estimate today.',
    'h1': 'Pergolas & gazebos in Jacksonville',
    'answer': 'iTOP Pavers designs and builds custom pergolas and gazebos across Jacksonville, St. Augustine and St. Johns County. A pergola adds open, filtered shade over a patio or kitchen; a gazebo gives a fully roofed retreat. We size each structure to your space, use durable materials for Florida weather and handle the approvals.',
    'included': ['Design sized to your patio, deck or kitchen', 'Pergola or fully roofed gazebo', 'Durable materials for Florida weather', 'HOA and permit approvals handled', 'Paver patio underneath, if needed'],
    'why': [('Custom design', 'Tailored to your style and space.'), ('Built for Florida', 'Durable materials that withstand Florida’s weather.'), ('Minimum upkeep', 'Low-maintenance, long-lasting construction.'), ('Hassle-free', 'A seamless process from design to installation.')],
    'faqs': [
      ('What is the difference between a pergola and a gazebo?', 'A pergola has an open, slatted roof that gives filtered shade and keeps an airy feel. A gazebo is a free-standing structure with a solid roof that gives full cover from sun and rain.'),
      ('Can a pergola be added over my existing patio?', 'Often, yes. We check the patio, the footing locations and any HOA rules during the free consultation and tell you what will work.'),
      ('Do I need a permit for a pergola?', 'Many structures need HOA approval and some need a permit. iTOP Pavers takes care of HOA, engineering and permit approvals as part of the project.'),
      ('Can you build a pergola with an outdoor kitchen?', 'Yes. Pergolas are often designed over outdoor kitchens and dining areas, and iTOP Pavers builds both.'),
    ],
  },
  {
    'slug': 'retaining-walls-firepits', 'name': 'Retaining Walls & Fire Pits', 'nav': 'Retaining walls & fire pits', 'group': 'Outdoor Living', 'type': 'Fire pit or retaining wall', 'img': 'patio-firepit-lake', 'icon': 's-wall',
    'card': 'Seat walls, grade changes and a place to gather.',
    'title': 'Retaining Walls & Fire Pits in Jacksonville | iTOP Pavers',
    'desc': 'Retaining walls, seat walls and built-in paver fire pits in Jacksonville and St. Johns County. Structure, warmth and style. Free estimate: (904) 525-9191.',
    'h1': 'Retaining walls & fire pits in Jacksonville',
    'answer': 'iTOP Pavers builds retaining walls, seat walls and built-in fire pits across Jacksonville, St. Augustine and St. Johns County. Retaining walls give structure and support where the ground changes level, while a fire pit with a curved seat wall creates a natural place to gather, built in block that matches your patio.',
    'included': ['Retaining walls for grade changes and raised beds', 'Built-in fire pits with seat walls', 'Block that matches or complements your patio', 'Proper base and drainage behind walls', 'Paver patio around the fire pit'],
    'why': [('Custom design', 'Designs that enhance your landscape.'), ('Built to last', 'Durable materials designed to withstand weather and erosion.'), ('Minimum upkeep', 'Low-maintenance, long-lasting construction.'), ('Hassle-free', 'A seamless process from design to installation.')],
    'faqs': [
      ('Are your retaining walls functional or decorative?', 'Both. Our retaining walls provide structural support while enhancing the beauty of your outdoor space.'),  # old site FAQ
      ('Can a fire pit be built into a paver patio?', 'Yes. We often build the fire pit and a curved seat wall as part of the patio, as on our lakeside fire pit project.'),
      ('What is a seat wall?', 'A seat wall is a low wall at sitting height, usually curved around a fire pit or along the edge of a patio, that gives built-in seating without extra furniture.'),
      ('Why does drainage matter behind a retaining wall?', 'Water trapped behind a wall builds pressure and can push it over time. A properly built wall includes a compacted base and a way for water to drain, which is part of how we build them.'),
    ],
  },
  {
    'slug': 'screen-enclosures', 'name': 'Screen Enclosures', 'nav': 'Screen enclosures', 'group': 'Outdoor Living', 'type': 'Screen enclosure', 'img': 'screen-enclosure', 'icon': 's-screen',
    'card': 'Bug-free outdoor rooms over pools and lanais.',
    'title': 'Screen Enclosures in Jacksonville, FL | iTOP Pavers',
    'desc': 'Custom pool and patio screen enclosures in Jacksonville and St. Johns County. Keep bugs and debris out and enjoy the outdoors year-round. Free estimate.',
    'h1': 'Screen enclosures in Jacksonville & St. Johns County',
    'answer': 'iTOP Pavers designs and builds screen enclosures over pools, patios and lanais across Jacksonville, St. Augustine and St. Johns County. A screen enclosure keeps bugs and debris out so you can enjoy fresh air and natural light year-round, and we can build the paver floor underneath as part of the same project.',
    'included': ['Enclosure designed to fit your pool, patio or lanai', 'Keeps bugs and debris out', 'Paver floor underneath, if needed', 'HOA and permit approvals handled', 'Coordination with pool and deck work'],
    'why': [('Fits your space', 'We design an enclosure that fits your space and needs.'), ('Year-round comfort', 'Keeps bugs and debris out.'), ('Minimum upkeep', 'Low-maintenance, long-lasting construction.'), ('Hassle-free', 'A seamless process from design to installation.')],
    'faqs': [
      ('What does a screen enclosure do?', 'It turns a pool or patio into an outdoor room: fresh air and natural light without insects or falling debris, so the space is usable for more of the year.'),
      ('Can you enclose a pool and a patio together?', 'Yes. Our screen enclosure project covers a new paver patio, and enclosures can also span a pool and its deck.'),
      ('Do screen enclosures need a permit?', 'Usually, and many HOAs need to approve the design. iTOP Pavers takes care of HOA, engineering and permit approvals.'),
      ('Can you build the paver floor and the enclosure at the same time?', 'Yes. Building the patio or deck and the enclosure as one project means one schedule and one point of contact.'),
    ],
  },
]
for _s in SERVICES: _s['nav'] = _s['name']   # one name per service everywhere (nav, cards, headings, schema, footer)
SVC = {s['slug']: s for s in SERVICES}

# ---------------------------------------------------------------- general FAQ (visible on / and /faq/)
def _towns_sentence():
    return ', '.join(TOWN_NAMES[:-1]) + ' and ' + TOWN_NAMES[-1]
FAQ = [
  ('What areas does iTOP Pavers serve?', f'iTOP Pavers serves homeowners across Northeast Florida from our office in Jacksonville, including {_towns_sentence()}. If you are nearby but not listed, call {BIZ["phone"]} and we will tell you whether we can take on your project.'),
  ('Is the estimate free, and what does it include?', 'Yes. iTOP Pavers offers free consultations and estimates. We discuss your project, measure the space, give you our recommendations and provide a detailed written estimate, with no obligation.'),
  ('Are pavers better than poured concrete?', 'For most patios, driveways and pool decks, yes. Pavers are more durable, crack-resistant and visually appealing than traditional poured concrete. Because they are individual units on a compacted base, they flex instead of cracking across a slab, and a damaged paver can be replaced on its own.'),
  ('How do pavers hold up to Florida heat, sun and rain?', 'Very well when the base is built right. A compacted stone base and a slight slope move heavy rain away from the house, polymeric joint sand resists washout, and sealing helps protect colour from UV. Lighter colours stay cooler underfoot around pools.'),
  ('Do I need a permit or HOA approval for my project?', 'Often, yes. Many Northeast Florida HOAs require design approval, and some projects need a permit. iTOP Pavers takes care of HOA, engineering and permit approvals as part of the project, so you do not have to handle the paperwork.'),
  ('How long does a paver project take?', 'It depends on the size of the area, site access and how long HOA or permit approval takes. iTOP Pavers gives you a schedule with your written estimate before any work begins.'),  # TODO(client): typical durations
  ('Can you build a pool and the deck together?', 'Yes. iTOP Pavers installs fiberglass pools and builds paver pool decks, so the pool, deck, coping and screen enclosure can be planned together with one point of contact.'),
  ('Are your installations covered by a warranty?', 'Yes. iTOP Pavers stands behind its work and offers warranties on materials and craftsmanship. Warranty details vary by service, so ask us for the terms that apply to your project.'),  # old site; TODO(client): confirm still current + terms
  ('What payment methods do you accept? Is financing available?', 'We accept cash, checks, credit and debit cards, and bank transfers. We can also suggest flexible financing plans to make your project more affordable; ask us about available options.'),  # old site; TODO(client): confirm
  ('Can I customise the design of my patio, driveway or walkway?', 'Absolutely. We offer custom designs to match your style, space and how you want to use it, including pattern, paver collection, colour blend and border.'),
  ('Do you seal pavers and maintain existing paver areas?', 'Yes. Our paving maintenance includes deep cleaning, joint stabilisation, sealing and minor repairs to keep patios, driveways and walkways in top condition.'),
  ('What is the installation process for a new patio, driveway or pool deck?', 'Our process includes a consultation, site preparation, expert installation and finishing touches: edges secured, joints sealed and every detail inspected.'),
]
HOME_FAQ = FAQ[:10]

# ---------------------------------------------------------------- process / advantage (old site wording)
PROCESS = [
    ('Share', 'Share your ideas, and we’ll create a clear plan.', 'Free visit'),
    ('Design smart', 'We design a space that fits your style and needs.', 'Written estimate'),
    ('Handle permits', 'We take care of HOA, engineering and permit approvals.', 'Paperwork done'),
    ('Bring to life', 'We bring your vision to life with expert craftsmanship.', 'Built by our crew'),
]
ADVANTAGE = ['Free on-site consultation & estimate', 'HOA, engineering & permit approvals handled', 'Pools, pavers & enclosures from one team',
             f'Licensed Florida contractor {BIZ["licence"]}', f'{BIZ["experience"]} of experience', 'Low-maintenance, long-lasting construction']
STATS = [('Free', 'On-site consultation & estimate'), ('10+ years', 'Building outdoor spaces'), ('Permits', 'HOA & permit approvals handled'), ('Licensed', f'Florida contractor {BIZ["licence"]}')]

# ---------------------------------------------------------------- build-up layers
LAYERS = [
    ('Compacted subgrade', 'We dig out the soil and compact it so the patio never settles unevenly.', 'Subgrade'),
    ('Geotextile fabric', 'Keeps soil and stone apart so the base stays clean and strong.', 'Fabric'),
    ('Crushed-stone base', 'Laid and compacted in layers. This is what carries the load.', 'Stone base'),
    ('Bedding sand', 'A screeded, level bed that the pavers settle into.', 'Sand bed'),
    ('Pavers & edge restraint', 'Laid to pattern, cut clean at the border and locked in place.', 'Pavers'),
    ('Joint sand & sealer', 'Polymeric sand locks the joints; sealing protects colour from the Florida sun.', 'Sealer'),
]

# ---------------------------------------------------------------- laying patterns
PATTERNS = [
    ('h45', 'Herringbone 45°', 'Driveways and busy patios', 'The strongest interlock of the four; resists the twisting of turning tyres.'),
    ('h90', 'Herringbone 90°', 'Patios and pool decks', 'Classic and structured; lines up square with the house and pool.'),
    ('bond', 'Running bond', 'Walkways and narrow spaces', 'Clean, linear and calm; makes narrow areas feel longer.'),
    ('basket', 'Basketweave', 'Courtyards and entries', 'A traditional woven texture with a classic look.'),
]

# ---------------------------------------------------------------- comparison (general material knowledge, no prices)
COMPARE_COLS = ['Concrete pavers', 'Poured concrete', 'Travertine']
COMPARE = [
    ('Looks & options', 'Many colours, textures and patterns', 'Plain or stamped; limited options', 'Natural stone with soft veining'),
    ('Cracking', 'Individual units flex with the ground', 'Slabs can crack across the surface', 'Natural stone; can chip at edges'),
    ('Repairs', 'Lift and replace single pavers', 'Patches rarely match', 'Replace single tiles'),
    ('Heat underfoot', 'Light colours stay cooler', 'Depends on finish and colour', 'Stays cool; popular around pools'),
    ('Grip when wet', 'Textured finishes available', 'Depends on finish', 'Tumbled finishes give grip'),
    ('Upkeep', 'Clean, re-sand joints, reseal', 'Reseal; repair cracks', 'Seal to protect from staining'),
    ('Best for', 'Driveways, patios, pool decks, walkways', 'Budget slabs, utility areas', 'Pool decks and patios'),
]

# ---------------------------------------------------------------- paver collections (Tremron product photos)
COLLS = [
    {'id': 'olde-towne', 'name': 'Olde Towne', 'd': 'Tumbled, multi-size pavers with softened edges. A timeless look.', 'c': [['sand-dune', 'Sand Dune'], ['sierra', 'Sierra'], ['autumn-blend', 'Autumn Blend'], ['lions-bridge', 'Lions Bridge'], ['glacier', 'Glacier'], ['granite', 'Granite'], ['heritage', 'Heritage']]},
    {'id': 'mega-olde-towne', 'name': 'Mega Olde Towne', 'd': 'The Olde Towne look in larger units, for broad patios and pool decks.', 'c': [['sand-dune', 'Sand Dune'], ['sierra', 'Sierra'], ['autumn-blend', 'Autumn Blend'], ['glacier', 'Glacier']]},
    {'id': 'park-plaza', 'name': 'Park Plaza', 'd': 'Smooth, crisp-edged pavers for a clean, contemporary finish.', 'c': [['sandstone', 'Sandstone'], ['tan', 'Tan'], ['white', 'White'], ['sierra', 'Sierra'], ['autumn-blend', 'Autumn Blend'], ['glacier', 'Glacier'], ['charcoal', 'Charcoal']]},
    {'id': 'stonehurst', 'name': 'Stonehurst', 'd': 'A textured surface with the character of natural cut stone.', 'c': [['sand-dune', 'Sand Dune'], ['sierra', 'Sierra'], ['autumn-blend', 'Autumn Blend'], ['glacier', 'Glacier']]},
    {'id': 'brick', 'name': '4×8 Brick', 'd': 'The classic brick shape, ideal for herringbone driveways and borders.', 'c': [['tan', 'Tan'], ['taupe', 'Taupe'], ['sandstone', 'Sandstone'], ['natural', 'Natural'], ['granite', 'Granite'], ['charcoal', 'Charcoal'], ['heritage', 'Heritage'], ['santa-fe', 'Santa Fe']]},
]
BORD = [{'id': 'charcoal', 'name': 'Charcoal', 'tex': ['brick', 'charcoal']}, {'id': 'match', 'name': 'Matching', 'tex': None}, {'id': 'tan', 'name': 'Tan', 'tex': ['brick', 'tan']}]

# ---------------------------------------------------------------- projects (real iTOP jobs)
PROJ = [  # f = filter group, svc = service slug it belongs to
    {'t': 'Driveway', 'svc': 'driveways', 'img': 'driveway-gated', 'full': 1, 'big': 1, 'title': 'Gated entry driveway', 'sub': 'Tumbled pavers with a charcoal soldier course'},
    {'t': 'Patio', 'svc': 'retaining-walls-firepits', 'img': 'patio-firepit-lake', 'title': 'Lakeside fire pit & seat wall', 'sub': 'Built-in fire pit wrapped by a curved seat wall'},
    {'t': 'Pool deck', 'svc': 'pool-decks', 'img': 'pool-deck', 'title': 'Pool deck & coping', 'sub': 'Blended pavers with bullnose coping'},
    {'t': 'Patio', 'svc': 'walkways', 'img': 'front-entry', 'title': 'Front entry & steps', 'sub': 'Curved paver steps up to the front porch'},
    {'t': 'Outdoor living', 'svc': 'screen-enclosures', 'img': 'screen-enclosure', 'full': 1, 'title': 'Screen enclosure & patio', 'sub': 'Screened outdoor room over a new paver patio'},
    {'t': 'Driveway', 'svc': 'driveways', 'img': 'driveway-curved', 'title': 'Curved driveway', 'sub': 'Charcoal border following the curve'},
    {'t': 'Pool deck', 'svc': 'pool-decks', 'img': 'pool-deck-travertine', 'title': 'Travertine pool deck & spa', 'sub': 'Natural travertine around a raised spa'},
    {'t': 'Patio', 'svc': 'patios', 'img': 'patio-circle', 'full': 1, 'title': 'Circular garden patio', 'sub': 'Round patio with a soldier-course edge'},
    {'t': 'Driveway', 'svc': 'driveways', 'img': 'driveway-long', 'title': 'Long driveway with border', 'sub': 'Light blend framed in charcoal'},
    {'t': 'Driveway', 'svc': 'paving-maintenance', 'img': 'driveway-terracotta', 'title': 'Terracotta-blend driveway', 'sub': 'Warm tones to match a tile roof'},
    {'t': 'Driveway', 'svc': 'driveways', 'img': 'driveway-3car', 'title': 'Three-car driveway', 'sub': 'Full replacement in a tan blend'},
    {'t': 'Driveway', 'svc': 'driveways', 'img': 'driveway-border', 'title': 'Driveway with soldier border', 'sub': 'Clean lines from the street to the door'},
]
PROJ_FILTERS = [('All', 'All work'), ('Driveway', 'Driveways'), ('Patio', 'Patios & entries'), ('Pool deck', 'Pool decks'), ('Outdoor living', 'Outdoor living')]
HERO_SLIDES = [  # img, full, tag, quote type, title, sub
    ('driveway-gated', 1, 'Driveway', 'Driveway', 'Gated entry driveway', 'Tumbled pavers with a charcoal soldier course'),
    ('patio-firepit-lake', 0, 'Patio', 'Patio', 'Lakeside fire pit & seat wall', 'Built-in fire pit wrapped by a curved seat wall'),
    ('pool-deck', 0, 'Pool deck', 'Pool deck', 'Pool deck & coping', 'Blended pavers with bullnose coping'),
    ('screen-enclosure', 1, 'Screen enclosure', 'Screen enclosure', 'Screen enclosure & patio', 'Screened outdoor room over a new paver patio'),
    ('front-entry', 0, 'Entry', 'Walkway', 'Front entry & steps', 'Curved paver steps up to the front porch'),
    ('patio-circle', 1, 'Patio', 'Patio', 'Circular garden patio', 'Round patio with a soldier-course edge'),
]
QUOTE_TYPES = ['Patio', 'Driveway', 'Pool deck', 'Walkway', 'Paving maintenance', 'Fiberglass pool', 'Outdoor kitchen', 'Pergola or gazebo', 'Fire pit or retaining wall', 'Screen enclosure', 'Not sure yet']

# ---------------------------------------------------------------- about (old site About page)
ABOUT = {
    'intro': 'The heart and soul behind iTOP Pavers, Fabio has one goal: to create outdoor spaces that make your life more enjoyable and stress-free.',
    'story': [
        'Fabio’s construction journey began in the early 2000s in New Haven, Connecticut, where he was hired by CT Homes Real Estate Development and Investment company as a general contractor. His expertise in flipping houses quickly gained attention, and his projects were featured on the TV show “Flip This House”.',
        'In 2017, Fabio moved to Florida. Since then he has been dedicated to helping Northeast Florida homeowners turn their outdoor spaces into personal paradises, combining years of experience with a passion for design and craftsmanship.',
    ],
    # TODO(client): confirm the story is current, the spelling of the surname, and permission to show Fabio's photo
}
