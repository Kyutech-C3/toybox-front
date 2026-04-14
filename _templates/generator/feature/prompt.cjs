module.exports = {
  prompt: ({ inquirer, _args }) => {
    const featureQuestions = [
      {
        type: "input",
        name: "featureName",
        message: "What is the name of the new feature?",
        validate: (input) => (input ? true : "Feature name cannot be empty."),
      },
      {
        type: "confirm",
        name: "needsStyleSheet",
        message: "Does this feature need a stylesheet?",
        default: true,
      },
    ];
    return inquirer.prompt(featureQuestions);
  },
};
