searchInDirectory(directory, regexp, options, numPathsFound) {
  // Delay the require of vscode-ripgrep to not mess with the snapshot creation.
  if (!this.rgPath) {
    this.rgPath = require('vscode-ripgrep').rgPath.replace(
      /\bapp\.asar\b/,
      'app.asar.unpacked'
    );
  }

  const directoryPath = directory.getPath();
  const regexpStr = this.prepareRegexp(regexp.source);

  const args = ['--json', '--regexp', regexpStr];
  if (options.leadingContextLineCount) {
    args.push('--before-context', options.leadingContextLineCount);
  }
  if (options.trailingContextLineCount) {
    args.push('--after-context', options.trailingContextLineCount);
  }
  if (regexp.ignoreCase) {
    args.push('--ignore-case');
  }
  for (const inclusion of this.prepareGlobs(
    options.inclusions,
    directoryPath
  )) {
    args.push('--glob', inclusion);
  }
  for (const exclusion of this.prepareGlobs(
    options.exclusions,
    directoryPath
  )) {
    args.push('--glob', '!' + exclusion);
  }

  if (this.isMultilineRegexp(regexpStr)) {
    args.push('--multiline');
  }

  if (options.includeHidden) {
    args.push('--hidden');
  }

  if (options.follow) {
    args.push('--follow');
  }

  if (!options.excludeVcsIgnores) {
    args.push('--no-ignore-vcs');
  }

  if (options.PCRE2) {
    args.push('--pcre2');
  }

  args.push('.');

  const child = spawn(this.rgPath, args, {
    cwd: directoryPath,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const didMatch = options.didMatch || (() => {});
  let cancelled = false;

  const returnedPromise = new Promise((resolve, reject) => {
    let buffer = '';
    let bufferError = '';
    let pendingEvent;
    let pendingLeadingContext;
    let pendingTrailingContexts;

    child.on('close', (code, signal) => {
      // code 1 is used when no results are found.
      if (code !== null && code > 1) {
        reject(new Error(bufferError));
      } else {
        resolve();
      }
    });

    child.stderr.on('data', chunk => {
      bufferError += chunk;
    });

    child.stdout.on('data', chunk => {
      if (cancelled) {
        return;
      }

      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const message = JSON.parse(line);
        updateTrailingContexts(message, pendingTrailingContexts, options);

        if (message.type === 'begin') {
          pendingEvent = {
            filePath: path.join(directoryPath, getText(message.data.path)),
            matches: []
          };
          pendingLeadingContext = [];
          pendingTrailingContexts = new Set();
        } else if (message.type === 'match') {
          const trailingContextLines = [];
          pendingTrailingContexts.add(trailingContextLines);

          processUnicodeMatch(message.data);

          for (const submatch of message.data.submatches) {
            const { lineText, range } = processSubmatch(
              submatch,
              getText(message.data.lines),
              message.data.line_number - 1
            );

            pendingEvent.matches.push({
              matchText: getText(submatch.match),
              lineText,
              lineTextOffset: 0,
              range,
              leadingContextLines: [...pendingLeadingContext],
              trailingContextLines
            });
          }
        } else if (message.type === 'end') {
          options.didSearchPaths(++numPathsFound.num);
          didMatch(pendingEvent);
          pendingEvent = null;
        }

        updateLeadingContext(message, pendingLeadingContext, options);
      }
    });
  });

  returnedPromise.cancel = () => {
    child.kill();
    cancelled = true;
  };

  return returnedPromise;
}
