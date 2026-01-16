const prompts = require("../../prompts.json");

function getPrompt(type, sub_type, user_input) {
  return new Promise((resolve, reject) => {
    try {
      if (!type || !sub_type) {
        return reject(new Error("type and sub_type are required."));
      }

      const [tool, variant] = sub_type.split(".");
      if (!tool || !variant) {
        return reject(
          new Error(
            'sub_type must be in the format "<tool>.<variant>", e.g. "summarizer.long".'
          )
        );
      }

      const typeNode = prompts[type];
      if (!typeNode) {
        return reject(new Error(`Invalid type: ${type}`));
      }

      const toolNode = typeNode[tool];
      if (!toolNode) {
        return reject(new Error(`Invalid tool "${tool}" for type "${type}".`));
      }

      const template = toolNode[variant];
      if (!template) {
        return reject(
          new Error(
            `Invalid variant "${variant}" for tool "${tool}" and type "${type}".`
          )
        );
      }

      const prompt = template.replace(/INPUT_TEXT/g, user_input);
      return resolve(prompt);
    } catch (error) {
      return reject(error);
    }
  });
}

module.exports = { getPrompt };
