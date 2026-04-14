---
to: ./src/shared/ui/<%= componentName %>/index.tsx
---

interface <%= componentName %>Props {}

export const <%= componentName %> = ({} : <<%= componentName %>Props>) => {

  return (
    <div>hello component!</div>
  );
};