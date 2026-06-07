/**
 * ai-agent-house — Dynamic Import Helper
 *
 * Utility to dynamically import optional peer dependencies
 * without TypeScript attempting compile-time module resolution.
 * @module
 * @internal
 */

/**
 * Dynamically import a module by name.
 * Uses indirect eval to bypass TypeScript's static analysis of import() calls.
 *
 * @param moduleName - The npm package name to import
 * @returns The imported module
 * @throws Error if the module is not installed
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function importModule(moduleName: string): Promise<any> {
  try {
    // Use Function constructor to prevent TS from resolving the module
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const dynamicImport = new Function(
      "moduleName",
      "return import(moduleName)"
    ) as (name: string) => Promise<unknown>;
    return await dynamicImport(moduleName);
  } catch {
    throw new Error(
      `Failed to import "${moduleName}". Install it with: npm install ${moduleName}`
    );
  }
}
