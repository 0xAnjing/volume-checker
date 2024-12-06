# Jupiter Volume Checker

# Pre-requisite

- Node.js
- Flipside Crypto API keys

# Installation

1. Clone this repository
2. Run `npm install`
3. Get your API key from [FlipsideCrypto.xyz](https://flipsidecrypto.xyz/settings/api)
4. Run `cp .env.example .env`
5. Paste your API key into the `.env` file

# Usage

1. Run `cp ./wallets/addresses.txt.example ./wallets/addresses.txt`
2. Paste your wallet public addresses into `addresses.txt` file

- One line for each wallet

3. Paste all json files containing your private keys into `./wallets` folder
4. Run `node index.js`
5. Check the `./output/output.csv` file for the results
