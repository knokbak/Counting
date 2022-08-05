# count+
I made count+ for [Sound's World](https://discord.gg/sound), which needed a new counting bot. The count+ bot was mainly based on Countr, and is licensed under the GNU Affero General Public License v3.0 (or later).

## Building
Building this bot is quite simple. Just run the `npm install` then `npm run build` commands.

## Envoirement variables
You must create a `.env` file in the project's root directory with the following contents:

```js
DISCORD_ID=bot_user_id
DISCORD_TOKEN=bot_token
MONGO_CONNECTION_URI=full_connection_url_for_mongodb
BOT_OWNER_ID=your_discord_account_id
```

## Commands and further reading
More information can be found at [countplus.pages.dev](https://countplus.pages.dev). You can [invite count+ to your Discord server here](https://discord.com/api/oauth2/authorize?client_id=872376168865730570&permissions=0&redirect_uri=https%3A%2F%2Fcountplus.pages.dev&response_type=code&scope=identify%20bot%20applications.commands%20applications.commands.permissions.update)!

## Contributing
Before contributing, please review [CONTRIBUTING.md](https://github.com/knokbak/counting/blob/main/CONTRIBUTING.md) 
first. It includes a list of terms and conditions for contributing to this project.

## GNU Affero General Public License

https://github.com/knokbak/counting    
Copyright (C) 2022  knokbak

This program is free software: you can redistribute it and/or modify 
it under the terms of the GNU Affero General Public License as published 
by the Free Software Foundation, either version 3 of the License, or 
(at your option) any later version.

This program is distributed in the hope that it will be useful, 
but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the 
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License 
along with this program.  If not, see <https://www.gnu.org/licenses/>.
