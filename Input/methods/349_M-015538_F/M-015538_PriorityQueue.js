dequeue() {
  const elements = this.elements_;
  const priorities = this.priorities_;
  const element = elements[0];
  if (elements.length == 1) {
    elements.length = 0;
    priorities.length = 0;
  } else {
    elements[0] = elements.pop();
    priorities[0] = priorities.pop();
    this.siftUp_(0);
  }
  const elementKey = this.keyFunction_(element);
  delete this.queuedElements_[elementKey];
  return element;
}
