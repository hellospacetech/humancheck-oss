#!/usr/bin/env node
import { Bot, InlineKeyboard, Context } from "grammy";
import { createHttpApiClient, ApiClient } from "./api-client.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN environment variable is required");
  process.exit(1);
}

const bot = new Bot(token);
const api: ApiClient = createHttpApiClient();

// ───────────────── /start — Link account ─────────────────

bot.command("start", async (ctx: Context) => {
  const args = ctx.message?.text?.split(" ").slice(1).join(" ").trim();

  if (!args) {
    await ctx.reply(
      "Welcome to HumanCheckMe Bot!\n\n" +
        "To link your Telegram account, send:\n" +
        "/start your-email@example.com\n\n" +
        "After linking you will receive task notifications here.",
    );
    return;
  }

  const email = args.toLowerCase();
  const chatId = String(ctx.chat!.id);

  const result = await api.linkAccount(email, chatId);
  await ctx.reply(result.message);
});

// ───────────────── /tasks — Available tasks ─────────────────

bot.command("tasks", async (ctx: Context) => {
  const chatId = String(ctx.chat!.id);
  const tasks = await api.getAvailableTasks(chatId);

  if (tasks.length === 0) {
    await ctx.reply("No available tasks right now. Check back later!");
    return;
  }

  for (const task of tasks) {
    const deadlineStr = task.deadline
      ? `\nDeadline: ${new Date(task.deadline).toLocaleDateString()}`
      : "";

    const text =
      `*${task.projectName}*\n` +
      `Difficulty: ${task.difficulty}` +
      deadlineStr +
      `\nTesters: ${task.assignedCount}/${task.testerCount}` +
      `\nRound: #${task.roundNumber}`;

    const keyboard = new InlineKeyboard()
      .text("Accept", `accept:${task.id}:${task.roundId}`)
      .text("Skip", `skip:${task.id}`);

    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
  }
});

// ───────────────── /mytests — My assignments ─────────────────

bot.command("mytests", async (ctx: Context) => {
  const chatId = String(ctx.chat!.id);
  const tasks = await api.getMyTasks(chatId);

  if (tasks.length === 0) {
    await ctx.reply("You have no test assignments yet.\nUse /tasks to find available tasks.");
    return;
  }

  const statusEmoji: Record<string, string> = {
    PENDING: "⏳",
    ACCEPTED: "✅",
    IN_PROGRESS: "🔄",
    COMPLETED: "✔️",
  };

  const lines = tasks.map((t) => {
    const emoji = statusEmoji[t.status] || "•";
    const round = t.roundNumber ? ` (R${t.roundNumber})` : "";
    return `${emoji} ${t.projectName}${round} — ${t.status}`;
  });

  await ctx.reply("*Your Tests:*\n\n" + lines.join("\n"), { parse_mode: "Markdown" });
});

// ───────────────── Inline keyboard callbacks ─────────────────

bot.callbackQuery(/^accept:/, async (ctx) => {
  const parts = ctx.callbackQuery.data.split(":");
  const taskId = parts[1];
  const roundId = parts[2];
  const chatId = String(ctx.chat!.id);

  const result = await api.acceptTask(chatId, taskId, roundId);
  await ctx.answerCallbackQuery({ text: result.message });

  if (result.success) {
    await ctx.editMessageText(
      ctx.callbackQuery.message?.text + "\n\n--- ACCEPTED ---",
    );
  }
});

bot.callbackQuery(/^skip:/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: "Task skipped." });
  await ctx.editMessageText(
    ctx.callbackQuery.message?.text + "\n\n--- SKIPPED ---",
  );
});

// ───────────────── Start polling ─────────────────

bot.start({
  onStart: () => {
    console.log("HumanCheckMe Telegram Bot is running (polling mode)");
  },
});

// Graceful shutdown
function shutdown() {
  console.log("Stopping bot...");
  bot.stop();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { bot };
