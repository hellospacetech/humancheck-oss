# @humancheck/telegram-bot

Telegram bot for [HumanCheck](https://humancheckme.com) — collect human feedback via Telegram.

Testers receive task assignments, submit feedback, and track their testing progress through Telegram.

## Install

```bash
npm install @humancheck/telegram-bot
```

## Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Set environment variables:

```bash
export TELEGRAM_BOT_TOKEN="your-bot-token"
export HUMANCHECK_API_URL="https://api.humancheckme.com"
export HUMANCHECK_API_KEY="your-api-key"
```

3. Start the bot:

```bash
npx humancheck-bot
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Register as a tester |
| `/tasks` | View available tasks |
| `/mytests` | View your assigned tests |

## How It Works

1. Tester sends `/start` to register
2. Bot notifies testers of new available tasks
3. Tester accepts a task and follows test scenarios
4. Tester submits feedback (pass/fail, screenshots, descriptions)
5. Results flow back to the HumanCheck dashboard

## License

[MIT](../../LICENSE)
