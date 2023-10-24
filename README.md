# 2024 Bot

## Setup
- Install [NodeJS and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- Create a [Discord Application](https://discord.com/developers/applications)
- Clone the repo
- Install dependencies `npm i`
- Create a `config.json` file and fill in the values from `config.example.json`

## Running
Before first run, run the command `npm run prepare`

To deploy application commands to the guild:

`npm run deploy`

To clear all application commands from the guild:

`npm run clear`

To run raw typescript without having to build (development):

`npm run dev`

To run the development environment with nodemon (restart on file save):

`npm run dev:nm`

To test production builds:

`npm run build`

`npm run start`

## Development
Git hooks have been set up to lint and format all code via Husky pre-commit. Please make sure all code that is proposed be linted and formatted with the set configs. It should be done automatically most of the time, but in case it wasn't, use `npm run lint` amd `npm run format`