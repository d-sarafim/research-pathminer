static _preprocess(source, defines = new Map()) {

    const originalSource = source;

    // stack, storing info about ifdef blocks
    const stack = [];

    // true if the function encounter a problem
    let error = false;

    let match;
    while ((match = KEYWORD.exec(source)) !== null) {

        const keyword = match[1];
        switch (keyword) {
            case 'define': {

                // read the rest of the define line
                DEFINE.lastIndex = match.index;
                const define = DEFINE.exec(source);
                Debug.assert(define, `Invalid [${keyword}]: ${source.substring(match.index, match.index + 100)}...`);
                error ||= define === null;
                const expression = define[1];

                // split it to identifier name and a value
                IDENTIFIER.lastIndex = define.index;
                const identifierValue = IDENTIFIER.exec(expression);
                const identifier = identifierValue[1];
                let value = expression.substring(identifier.length).trim();
                if (value === "") value = "true";

                // are we inside if-blocks that are accepted
                const keep = Preprocessor._keep(stack);

                if (keep) {
                    defines.set(identifier, value);
                }

                Debug.trace(TRACEID, `${keyword}: [${identifier}] ${value} ${keep ? "" : "IGNORED"}`);

                // continue on the next line
                KEYWORD.lastIndex = define.index + define[0].length;
                break;
            }

            case 'undef': {

                // read the rest of the define line
                UNDEF.lastIndex = match.index;
                const undef = UNDEF.exec(source);
                const identifier = undef[1].trim();

                // are we inside if-blocks that are accepted
                const keep = Preprocessor._keep(stack);

                // remove it from defines
                if (keep) {
                    defines.delete(identifier);
                }

                Debug.trace(TRACEID, `${keyword}: [${identifier}] ${keep ? "" : "IGNORED"}`);

                // continue on the next line
                KEYWORD.lastIndex = undef.index + undef[0].length;
                break;
            }

            case 'extension': {
                EXTENSION.lastIndex = match.index;
                const extension = EXTENSION.exec(source);
                Debug.assert(extension, `Invalid [${keyword}]: ${source.substring(match.index, match.index + 100)}...`);
                error ||= extension === null;
                if (extension) {
                    const identifier = extension[1];

                    // are we inside if-blocks that are accepted
                    const keep = Preprocessor._keep(stack);

                    if (keep) {
                        defines.set(identifier, "true");
                    }

                    Debug.trace(TRACEID, `${keyword}: [${identifier}] ${keep ? "" : "IGNORED"}`);
                }

                // continue on the next line
                KEYWORD.lastIndex = extension.index + extension[0].length;
                break;
            }

            case 'ifdef':
            case 'ifndef':
            case 'if': {

                // read the if line
                IF.lastIndex = match.index;
                const iff = IF.exec(source);
                const expression = iff[2];

                // evaluate expression
                const evaluated = Preprocessor.evaluate(expression, defines);
                error ||= evaluated.error;
                let result = evaluated.result;
                if (keyword === 'ifndef') {
                    result = !result;
                }

                // add info to the stack (to be handled later)
                stack.push({
                    anyKeep: result,        // true if any branch was already accepted
                    keep: result,           // true if this branch is being taken
                    start: match.index,     // start index if IF line
                    end: IF.lastIndex       // end index of IF line
                });

                Debug.trace(TRACEID, `${keyword}: [${expression}] => ${result}`);

                // continue on the next line
                KEYWORD.lastIndex = iff.index + iff[0].length;
                break;
            }

            case 'endif':
            case 'else':
            case 'elif': {

                // match the endif
                ENDIF.lastIndex = match.index;
                const endif = ENDIF.exec(source);

                const blockInfo = stack.pop();

                // code between if and endif
                const blockCode = blockInfo.keep ? source.substring(blockInfo.end, match.index) : "";
                Debug.trace(TRACEID, `${keyword}: [previous block] => ${blockCode !== ""}`);

                // cut out the IF and ENDIF lines, leave block if required
                source = source.substring(0, blockInfo.start) + blockCode + source.substring(ENDIF.lastIndex);
                KEYWORD.lastIndex = blockInfo.start + blockCode.length;

                // handle else if
                const endifCommand = endif[1];
                if (endifCommand === 'else' || endifCommand === 'elif') {

                    // if any branch was already accepted, all else branches need to fail regardless of the result
                    let result = false;
                    if (!blockInfo.anyKeep) {
                        if (endifCommand === 'else') {
                            result = !blockInfo.keep;
                        } else {
                            const evaluated = Preprocessor.evaluate(endif[2], defines);
                            result = evaluated.result;
                            error ||= evaluated.error;
                        }
                    }

                    // add back to stack
                    stack.push({
                        anyKeep: blockInfo.anyKeep || result,
                        keep: result,
                        start: KEYWORD.lastIndex,
                        end: KEYWORD.lastIndex
                    });
                    Debug.trace(TRACEID, `${keyword}: [${endif[2]}] => ${result}`);
                }

                break;
            }
        }
    }

    if (error) {
        console.warn("Failed to preprocess shader: ", { source: originalSource });
        return originalSource;
    }

    return source;
}
