update(dt) {
    if (!this._playing) {
        return;
    }
    let state;
    let animation;
    let clip;
    // update time when looping or when the active state is not at the end of its duration
    if (this.activeState.loop || this._timeInState < this.activeStateDuration) {
        this._timeInStateBefore = this._timeInState;
        this._timeInState += dt * this.activeState.speed;
        // if the active state is not looping and the time in state is greater than the duration, set the time in state to the state duration
        // and update the delta time accordingly
        if (!this.activeState.loop && this._timeInState > this.activeStateDuration) {
            this._timeInState = this.activeStateDuration;
            dt = this.activeStateDuration - this._timeInStateBefore;
        }
    }

    // transition between states if a transition is available from the active state
    const transition = this._findTransition(this._activeStateName);
    if (transition)
        this.updateStateFromTransition(transition);

    if (this._isTransitioning) {
        this._currTransitionTime += dt;
        if (this._currTransitionTime <= this._totalTransitionTime) {
            const interpolatedTime = this._totalTransitionTime !== 0 ? this._currTransitionTime / this._totalTransitionTime : 1;
            // while transitioning, set all previous state animations to be weighted by (1.0 - interpolationTime).
            for (let i = 0; i < this._transitionPreviousStates.length; i++) {
                state = this._findState(this._transitionPreviousStates[i].name);
                const stateWeight = this._transitionPreviousStates[i].weight;
                for (let j = 0; j < state.animations.length; j++) {
                    animation = state.animations[j];
                    clip = this._animEvaluator.findClip(animation.name + '.previous.' + i);
                    if (clip) {
                        clip.blendWeight = (1.0 - interpolatedTime) * animation.normalizedWeight * stateWeight;
                    }
                }
            }
            // while transitioning, set active state animations to be weighted by (interpolationTime).
            state = this.activeState;
            for (let i = 0; i < state.animations.length; i++) {
                animation = state.animations[i];
                this._animEvaluator.findClip(animation.name).blendWeight = interpolatedTime * animation.normalizedWeight;
            }
        } else {
            this._isTransitioning = false;
            // when a transition ends, remove all previous state clips from the evaluator
            const activeClips = this.activeStateAnimations.length;
            const totalClips = this._animEvaluator.clips.length;
            for (let i = 0; i < totalClips - activeClips; i++) {
                this._animEvaluator.removeClip(0);
            }
            this._transitionPreviousStates = [];
            // when a transition ends, set the active state clip weights so they sum to 1
            state = this.activeState;
            for (let i = 0; i < state.animations.length; i++) {
                animation = state.animations[i];
                clip = this._animEvaluator.findClip(animation.name);
                if (clip) {
                    clip.blendWeight = animation.normalizedWeight;
                }
            }
        }
    } else {
        if (this.activeState._blendTree.constructor !== AnimNode) {
            state = this.activeState;
            for (let i = 0; i < state.animations.length; i++) {
                animation = state.animations[i];
                clip = this._animEvaluator.findClip(animation.name);
                if (clip) {
                    clip.blendWeight = animation.normalizedWeight;
                    if (animation.parent.syncAnimations) {
                        clip.speed = animation.speed;
                    }
                }
            }
        }
    }
    this._animEvaluator.update(dt, this.activeState.hasAnimations);
}
