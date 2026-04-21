update(deltaTime, outputAnimation = true) {
    // copy clips
    const clips = this._clips;

    // stable sort order
    const order = clips.map(function (c, i) {
        return i;
    });
    AnimBlend.stableSort(order, function (a, b) {
        return clips[a].blendOrder < clips[b].blendOrder;
    });

    for (let i = 0; i < order.length; ++i) {
        const index = order[i];
        const clip = clips[index];
        const inputs = this._inputs[index];
        const outputs = this._outputs[index];
        const blendWeight = clip.blendWeight;

        // update clip
        if (blendWeight > 0.0) {
            clip._update(deltaTime);
        }
        if (!outputAnimation) break;

        let input;
        let output;
        let value;

        if (blendWeight >= 1.0) {
            for (let j = 0; j < inputs.length; ++j) {
                input = inputs[j];
                output = outputs[j];
                value = output.value;

                AnimBlend.set(value, input, output.target.type);

                output.blendCounter++;
            }
        } else if (blendWeight > 0.0) {
            for (let j = 0; j < inputs.length; ++j) {
                input = inputs[j];
                output = outputs[j];
                value = output.value;

                if (output.blendCounter === 0) {
                    AnimBlend.set(value, input, output.target.type);
                } else {
                    AnimBlend.blend(value, input, blendWeight, output.target.type);
                }

                output.blendCounter++;
            }
        }
    }

    // apply result to anim targets
    const targets = this._targets;
    const binder = this._binder;
    for (const path in targets) {
        if (targets.hasOwnProperty(path)) {
            const target = targets[path];
            // if this evaluator is associated with an anim component then we should blend the result of this evaluator with all other anim layer's evaluators
            if (binder.animComponent && target.target.isTransform) {
                const animTarget = binder.animComponent.targets[path];
                if (animTarget.counter === animTarget.layerCounter) {
                    animTarget.counter = 0;
                }
                if (!animTarget.path) {
                    animTarget.path = path;
                    animTarget.baseValue = target.target.get();
                    animTarget.setter = target.target.set;
                }
                // Add this layer's value onto the target value
                animTarget.updateValue(binder.layerIndex, target.value);

                animTarget.counter++;
            } else {
                target.target.set(target.value);
            }
            target.blendCounter = 0;
        }
    }
    // give the binder an opportunity to update itself
    // TODO: is this even necessary? binder could know when to update
    // itself without our help.
    this._binder.update(deltaTime);
}
