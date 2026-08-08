import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "supabase/.temp/**"] },
  ...nextVitals,
  ...nextTypeScript,
  { files: ["src/app/(app)/dashboard/page.tsx"], rules: { "@typescript-eslint/no-unused-vars": "off" } },
  { files: ["src/features/demo/demo-store.tsx"], rules: { "@typescript-eslint/no-explicit-any": "off" } },
];

export default config;
