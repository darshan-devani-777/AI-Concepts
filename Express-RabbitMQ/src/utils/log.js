const chalk = require("chalk");

function printBlock(colorFn, title, data = {}) {
  console.log(colorFn(`\n${title}`));

  Object.entries(data).forEach(([key, value], index, arr) => {
    const isLast = index === arr.length - 1;
    const prefix = isLast ? "└─" : "├─";
    console.log(colorFn(`   ${prefix} ${key} : ${value}`));
  });
}

function getWorkerColor(action) {
  if (action.includes("FAILED") || action.includes("DLQ")) return chalk.red;

  if (action.includes("REQUEUE") || action.includes("RETRY"))
    return chalk.yellow;

  return chalk.blue;
}

function logWorker(action, data = {}) {
  const color = getWorkerColor(action.toUpperCase());

  printBlock(color, `[WORKER] ${action}`, data);
}

function logDLQ(action, data = {}) {
  printBlock(chalk.magenta, `[DLQ] ${action}`, data);
}

function logSystem(action, data = {}) {
  printBlock(chalk.green, `[SYSTEM] ${action}`, data);
}

module.exports = {
  logWorker,
  logDLQ,
  logSystem,
};
