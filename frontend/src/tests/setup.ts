import "@testing-library/dom";

class IntersectionObserverMock implements IntersectionObserver {
  root = null;
  rootMargin = "0px";
  thresholds = [0];
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
  unobserve() {}
}

globalThis.IntersectionObserver = IntersectionObserverMock;
