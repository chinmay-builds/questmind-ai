#!/usr/bin/env node

import { answerQuestion } from "./companion.js";

async function readQuestion() {
  const argument = process.argv.slice(2).join(" ").trim();
  if (argument) {
    return argument;
  }

  if (process.stdin.isTTY) {
    return "";
  }

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return chunks.join("").trim();
}

const question = await readQuestion();

if (!question) {
  console.error("Usage: questmind <game or rules question>");
  process.exitCode = 1;
} else {
  console.log(answerQuestion(question));
}
