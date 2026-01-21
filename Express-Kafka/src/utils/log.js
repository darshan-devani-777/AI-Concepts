const chalk = require("chalk");

function printBlock(colorFn, title, data = {}) {
  console.log(colorFn(`\n${title}`));

  Object.entries(data).forEach(([key, value], index, arr) => {
    const isLast = index === arr.length - 1;
    const prefix = isLast ? "└─" : "├─";
    console.log(colorFn(`   ${prefix} ${key} : ${value}`));
  });
}

function getKafkaColor(action) {
  if (action.includes("ERROR") || action.includes("FAILED")) return chalk.red;
  if (action.includes("WARN") || action.includes("RETRY")) return chalk.yellow;
  if (action.includes("SUCCESS") || action.includes("CONNECTED")) return chalk.green;
  return chalk.blue;
}

function logKafka(action, data = {}) {
  const color = getKafkaColor(action.toUpperCase());
  printBlock(color, `[KAFKA] ${action}`, data);
}

function logAPI(action, data = {}) {
  const color = action.includes("ERROR") ? chalk.red : chalk.cyan;
  printBlock(color, `[API] ${action}`, data);
}

function logSystem(action, data = {}) {
  printBlock(chalk.green, `[SYSTEM] ${action}`, data);
}

function logConsumer(action, data = {}) {
  const color = action.includes("ERROR") ? chalk.red : chalk.magenta;
  printBlock(color, `[CONSUMER] ${action}`, data);
}

function logProducer(action, data = {}) {
  const color = action.includes("ERROR") ? chalk.red : chalk.blue;
  printBlock(color, `[PRODUCER] ${action}`, data);
}

module.exports = {
  logKafka,
  logAPI,
  logSystem,
  logConsumer,
  logProducer,
};
