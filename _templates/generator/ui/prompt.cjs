module.exports = {
  prompt: ({ inquirer, _args }) => {
    const componentQuestions = [
      {
        type: "input",
        name: "componentName",
        message: "What is the name of the new ui?",
        validate: (input) => (input ? true : "Component name cannot be empty."),
      },
      {
        type: "confirm",
        name: "needsStyleSheet",
        message: "Does this ui need a stylesheet?",
        default: true,
      },
    ];
    return inquirer.prompt(componentQuestions);
  },
};
