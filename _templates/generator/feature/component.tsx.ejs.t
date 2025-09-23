---
to: ./src/features/<%= featureName %>/index.tsx
---

interface <%= featureName %>Props {}

export const <%= featureName %> = ({} : <<%= featureName %>Props>) => {

  return (
    <div>hello feature!</div>
  );
};