export function registerConsoleCommands(commands) {
  const registrations = Object.entries(commands).map(([name, command]) => {
    if (typeof command !== "function") {
      throw new TypeError(`Console command "${name}" must be a function.`);
    }

    const previousDescriptor = Object.getOwnPropertyDescriptor(window, name);
    Object.defineProperty(window, name, {
      configurable: true,
      value: command,
    });

    return { name, command, previousDescriptor };
  });

  return () => {
    registrations.forEach(({ name, command, previousDescriptor }) => {
      if (window[name] !== command) return;

      if (previousDescriptor) {
        Object.defineProperty(window, name, previousDescriptor);
      } else {
        delete window[name];
      }
    });
  };
}
