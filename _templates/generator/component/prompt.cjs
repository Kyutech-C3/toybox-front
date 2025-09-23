module.exports = {
  prompt: ({ inquirer, _args }) => {
    const componentQuestions = [
      {
        type: "input",
        name: "componentPath",
        message:
          "Please provide the path you want to add the component to (relative to Button or Modal/Input):",
        validate: (input) => (input ? true : "Component path cannot be empty."),
      },
      {
        type: "input",
        name: "componentName",
        message: "What is the name of the new component?",
        validate: (input) => (input ? true : "Component name cannot be empty."),
      },
      {
        type: "confirm",
        name: "needsStyleSheet",
        message: "Does this component need a stylesheet?",
        default: true,
      },
    ];
    return inquirer.prompt(componentQuestions);
  },
};
