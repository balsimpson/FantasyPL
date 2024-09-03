# Fantasy Premiere League Website

A simplified data view for Fantasy PL newbies.

You can see it in action [here](https://fantasyleague.vercel.app)!

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

### API Endpoints

#### General Information

`https://fantasy.premierleague.com/api/bootstrap-static/`

- A summary of all 38 gameweeks
- The game’s settings
- Basic information on all 20 PL teams
- Total number of FPL Users and overall chip usage
- Basic information on all Premier League players
- List of stats that FPL keeps track of
- The different FPL positions

#### Fixtures

`https://fantasy.premierleague.com/api/fixtures/`

- Goals
- Assists
- Cards
- Saves
- Pens missed
- Bonus points
- Own goals
- Pens saved

#### Player Details

`https://fantasy.premierleague.com/api/element-summary/{player-id}/`

- Remaining fixtures for the player, including:

  - Kickoff time
  - Gameweek number
  - Home or Away
  - Difficulty

- Previous fixtures and performance, including:
  - Minutes played
  - Goals
  - Assists
  - Conceded
  - Cards
  - Bonus
  - Influence
  - Creativity
  - xG
  - xA
  - Value
  - Transfer delta for that gameweek

#### Individual FPL Managers

`https://fantasy.premierleague.com/api/entry/{team-id}/`

- Name
- Team Name
- Favourite team
- Gameweek started
- Points
- Transfers
- Overall Rank
- Last gameweek rank
- Last gameweek points
- All league information, including:
  - Max entries
  - Scoring type
  - Cup qualification
  - Your rank within the league
  - League name
  - Date created


#### Individual FPL Managers - Transfers
`https://fantasy.premierleague.com/api/entry/{team-id}/transfers/`

A full history of transfers for that manager, including:

- Cost
- Gameweek
- Time of transfer
- Players in and out

#### Individual FPL Managers - Picks
`https://fantasy.premierleague.com/api/entry/{team-id}/event/{GW}/picks/`

Shows the detail of your 15 players for any given gameweek. The ‘Event’ parameter in the URL is the gameweek number. This includes:

- The general info for the gameweek, such as:
    - Points
    - Total points
    - Rank
    - Team value
    - Money in the bank
    - Transfers made that gameweek
- The stats of the individual players in the team, including:
    - Element ID (cross reference with bootstrap-static data)
    - Whether they’re captain or vice captain
    - Position in the team
