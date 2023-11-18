const MANIFOLD_GIT_SHA='74ab5cae'
const MANIFOLD_GIT_URL=`https://github.com/manifoldmarkets/manifold/blob/${MANIFOLD_GIT_SHA}/`

export class NestedLogger {
  private logs: Record<string, any> = {};
  private currentContext: Record<string, any> = this.logs;
  private contextStack: Array<Record<string, any>> = [];

  baseLog(key: string, message: string | number | Record<string, any> = ""): string {
    let repetition_index = 2;
    let fullKey = key;
    while (fullKey in this.currentContext) {
      fullKey = `${key} (${repetition_index++})`;
    }

    this.currentContext[fullKey] = JSON.parse(JSON.stringify(message));
    // If message is a list filter out objects in the list with "ignore" set to true.
    // This is mostly to keep the playground states out of the arg lists
    // if (Array.isArray(this.currentContext[fullKey])) {
    //   this.currentContext[fullKey] = this.currentContext[fullKey].filter((item) => !item.ignoreInArgList);
    // }
    if (message) {
      return key + " " + message.toString();
    } else {
      return key;
    }
  }

  log(key: string, message: string | number | Record<string, any> = ""): string {
    const wrapped_key = `<span class='manifold-op'>${key}</span>`;
    return this.baseLog(wrapped_key, message);
  }

  pLog(key: string, message: string | number | Record<string, any> = ""): string {
    const wrapped_key = `<span class='playground-op'>${key}</span>`;
    return this.baseLog(wrapped_key, message);
  }

  throw(key: string, message: string | number | Record<string, any> = ""): void {
    const wrapped_key = `<span class='error-op'>${key}</span>`;
    this.baseLog(wrapped_key, message);
    throw new Error(key + " " + message.toString());
  }

  in(): void {
    // Enter the most recent message (last property in the current context)
    const keys = Object.keys(this.currentContext);
    const lastKey = keys[keys.length - 1];

    // Assert that the last key doesn't have a truthy value since it will be overwritten
    if (this.currentContext[lastKey]) {
      throw new Error(`Cannot enter message ${lastKey} because it already has a value of ${this.currentContext[lastKey]}`);
    }
    this.currentContext[lastKey] = {};

    if (lastKey) {
      this.contextStack.push(this.currentContext);
      this.currentContext = this.currentContext[lastKey];
    }
  }

  getCurrentNestingLevel(): number {
    return this.contextStack.length;
  }

  out(level: number = -2): void {
    // By default, exit to the previous nesting level
    if (level == -2) {
        return this.out(this.getCurrentNestingLevel()-1);
    }
    if (level < 0 || level > this.getCurrentNestingLevel()) {
      throw new Error('Invalid nesting level');
    }

    // Exit to a given nesting level
    while (this.getCurrentNestingLevel() > level) {
      this.currentContext = this.contextStack.pop() || this.logs;
    }
  }

  getLog(): Record<string, any> {
    // Get the complete logs object
    return this.logs;
  }
}

//Return an html string that will be displayed in the log
export function codeUrl(text: string, url: string, line_number?: number) {
  return `<a href="${MANIFOLD_GIT_URL}${url}#L${line_number}" target="_blank">${text}</a>`;
}

export function logIndent<T extends (...args: any[]) => any>(message: string, func: T): T {
  return function (...args: any[]) {
    const indent_level = window.logger.getCurrentNestingLevel();
    window.logger.log(message);
    try {
      window.logger.in();
      window.logger.log(`...with args`, args);
      const result = func.apply(this, args);
      return result;
    } finally {
      window.logger.out(indent_level);
    }
  } as T;
}

//// Example usage:
// const logger = new NestedLogger();
// logger.log("Placing bet");
// logger.in();

// logger.log("Running validations");
// logger.in();

// logger.log("Checking balance");
// logger.log("Checking close time");

// logger.exit();
// logger.log("Executing transaction");

// console.log(JSON.stringify(logger.getLog(), null, 2));