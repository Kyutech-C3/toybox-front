---
to: ./src/features/<%= componentPath %>/<%= componentName %>/index.tsx
---

interface <%= componentName %>Props {}

export const <%= componentName %> = ({} : <<%= componentName %>Props>) => {

  return (
    <div>hello component!</div>
  );
};