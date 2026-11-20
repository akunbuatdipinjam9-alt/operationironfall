# Operation Ironfall

**A browser FPS that somehow turned into a whole project.**

Sup.

Welcome to **Operation Ironfall**, a browser-based FPS made by **Afternight Games**.

This game started with a pretty simple idea: what if I made an FPS using JavaScript?

And then things got a little out of hand.

Now we've got multiplayer, bots, operators, 3D maps, and a server that occasionally decides to have a bad day.

But hey, at least it works. Most of the time.

**Play the game:** [https://operationironfall.duckdns.org/](https://operationironfall.duckdns.org/)

---

## So, what even is this?

It's a first-person shooter that runs directly in your browser.

No giant downloads, no launcher, no installing 17 different things just to play a match.

Open the website, pick your operator, and get into the action.

Simple enough.

Well, unless the bots decide to ruin your day.

## What does the game have?

Here's some of the stuff we've been working on:

- **Multiplayer** — Fight actual players over the internet.
- **AI Bots** — Because sometimes you just wanna fight something without waiting for people.
- **Hybrid Matches** — Real players and bots in the same match. What could possibly go wrong?
- **Different Operators** — Multiple characters with their own personalities.
- **3D Maps** — Actual environments to explore and fight in.
- **Real-Time Combat** — Powered by WebSockets.
- **Operator Voice Lines** — Because apparently shooting wasn't enough. Now the characters can talk too.

And yeah, we're still working on more features.

## The Operators

Meet the squad:

- Vanguard
- Ghost
- Viper
- Specter
- Patch
- Ranger
- Nomad
- Bulwark
- Titan
- Big Boss Jeans

Each operator has their own identity, and we're working on making them feel more alive through voice lines and character interactions.

Some are serious.

Some are mysterious.

And some probably shouldn't be trusted with a microphone.

## Wait, this is made with JavaScript?

Yep.

And somehow, it works.

| Technology       | What it does                     |
| ---------------- | -------------------------------- |
| HTML & CSS       | The interface and all that stuff |
| JavaScript       | Pretty much everything           |
| Three.js         | Makes the 3D world happen        |
| Node.js          | Handles the backend              |
| Express          | Runs the HTTP server             |
| WebSocket (`ws`) | Keeps multiplayer connected      |
| PM2              | Keeps the server running         |
| Nginx            | Handles the reverse proxy        |

No massive game engine required.

Just web technologies, questionable amounts of debugging, and a lot of patience.

## Wanna run this thing yourself?

Alright, let's do it.

You'll need Node.js, npm, and Git.

### 1. Clone the repository

```bash
git clone git clone https://github.com/akunbuatdipinjam9-alt/operationironfall.git
cd operation-ironfall
```

Replace `YOUR_USERNAME` with the actual GitHub username.

### 2. Install dependencies

```bash
npm install
npm --prefix server install
```

**DO NOT skip the second command.**

Seriously.

We learned that the hard way when the server kept crashing because it couldn't find `express`.

That was a fun day.

Not really.

### 3. Set up the environment

Create a `.env` file based on `.env.example`.

Here's an example for local development:

```env
HOST=127.0.0.1
PORT=3000
PUBLIC_HOST=localhost
TICK_HZ=20
SNAPSHOT_HZ=10
SESSION_GRACE_MS=30000
ROOM_EMPTY_TTL_MS=60000
MAX_MESSAGE_BYTES=32768
ALLOWED_ORIGINS=http://localhost:3000
```

Don't upload your actual production `.env` to GitHub.

Nobody needs your private server configuration.

### 4. Start the server

```bash
node server/index.js
```

Then open:

[http://localhost:3000](http://localhost:3000)

If everything works, congratulations.

If it doesn't, welcome to programming.

## Project Structure

Here's the basic layout:

```text
operation-ironfall/
├── client/
│   └── index.html
├── server/
│   ├── index.js
│   ├── rooms.js
│   ├── validation.js
│   └── package.json
├── package.json
├── .env.example
├── ecosystem.config.cjs
├── LICENSE
└── README.md
```

The client handles the game in your browser.

The server handles multiplayer and game sessions.

And the bugs?

Those are apparently everywhere.

Just kidding. Mostly.

## What's next?

A lot, actually.

Here's what we're planning to improve:

- [ ] Smarter AI bots
- [ ] More maps
- [ ] Better combat balancing
- [ ] More operator voice lines
- [ ] Improved animations
- [ ] Better optimization
- [ ] More gameplay modes
- [ ] Better multiplayer stability
- [ ] Less random bugs

Will we finish everything?

Hopefully.

When?

Don't ask me that.

## Found a bug?

Yeah, probably.

If you find something broken, open a GitHub Issue.

Tell us what happened, how to reproduce it, and what you expected to happen.

Screenshots and console logs are appreciated.

But please don't just say "game doesn't work" and leave.

Bro, we're developers, not mind readers.

## Wanna contribute?

Absolutely.

That's why we're sharing the source code in the first place.

Found some messy code? Clean it up.

Think the bots are dumb? Make them smarter.

Have a cool feature idea? Show us.

Here's how:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Test your stuff.
5. Open a Pull Request.

Just make sure your changes actually work.

We already have enough chaos.

## License and Usage

**Operation Ironfall is developed by Afternight Games.**

We're making the source code publicly available because we want people to learn, experiment, and build cool things with it.

Here's the deal:

**Non-commercial use**

You're free to use, study, modify, and share the source code for personal, educational, and non-commercial projects, subject to retaining the required copyright and license notices.

**Commercial use**

Wanna use our code in a paid game, monetized project, or commercial product?

That's allowed too.

But if your commercial project uses a substantial portion of Operation Ironfall's original source code, you must clearly include this credit:

**"Based on Operation Ironfall by Afternight Games"**

Put it somewhere people can actually find it, like your game's credits, About page, or official website.

Don't hide it in some random file nobody reads.

**A few important things:**

- Keep the original copyright and license notices when redistributing the code.
- Don't claim that Afternight Games officially endorses your project.
- Some music, voice recordings, sound effects, artwork, and other assets have separate permissions.
- Permission to use the source code doesn't automatically give you permission to redistribute every game asset.

See the `LICENSE` file for the complete terms.

This project uses custom licensing terms rather than a standard OSI-approved open-source license.

## A note from Afternight Games

So yeah.

That's Operation Ironfall.

We're not some massive AAA studio with unlimited money and hundreds of developers.

We're just trying to build something cool.

The project has gone through a ridiculous number of updates.

We've added features, broken features, fixed bugs, accidentally created new bugs, and somehow kept going.

At one point, the server decided it didn't need half its dependencies anymore.

That was not a great moment.

But that's what makes development interesting.

You try something.

It breaks.

You figure out why.

You fix it.

And then you do the whole thing again.

We're still experimenting, still learning, and still making Operation Ironfall better with every update.

If you wanna play, go ahead.

If you wanna explore the code, feel free.

And if you wanna contribute, we'd love to see what you can do.

**Thanks for checking out Operation Ironfall.**

Made by **Afternight Games**.

Now go play the game.

Or fix our bugs.

Both would be pretty helpful.
