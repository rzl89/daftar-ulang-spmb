import React from 'react';

export const AnimatePresence: React.FC<{children: React.ReactNode, mode?: string}> = ({ children }) => <>{children}</>;

const createMotionComponent = (Tag: any) => {
  return React.forwardRef(({ initial, animate, exit, transition, whileInView, viewport, layoutId, custom, variants, ...props }: any, ref) => {
    return <Tag ref={ref} {...props} />;
  });
};

export const motion = {
  div: createMotionComponent('div'),
  tr: createMotionComponent('tr'),
  td: createMotionComponent('td'),
  span: createMotionComponent('span'),
  button: createMotionComponent('button'),
  p: createMotionComponent('p'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  a: createMotionComponent('a'),
  main: createMotionComponent('main'),
  ul: createMotionComponent('ul'),
  li: createMotionComponent('li'),
  section: createMotionComponent('section'),
  article: createMotionComponent('article'),
  nav: createMotionComponent('nav'),
  header: createMotionComponent('header'),
  footer: createMotionComponent('footer')
};
