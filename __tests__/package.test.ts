
import fs from 'fs';
import path from 'path';

describe('package.json', () => {
  let packageJson: any;

  beforeAll(() => {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  });

  it('should have the correct name, version, and private status', () => {
    expect(packageJson.name).toBe('nextn');
    expect(packageJson.version).toBe('0.1.0');
    expect(packageJson.private).toBe(true);
  });

  it('should contain the essential scripts', () => {
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts.start).toBeDefined();
    expect(packageJson.scripts.lint).toBeDefined();
  });

  it('should have the correct dependencies', () => {
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies.next).toBeDefined();
    expect(packageJson.dependencies.react).toBeDefined();
    expect(packageJson.dependencies.firebase).toBeDefined();
  });

  it('should have the correct dev dependencies', () => {
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies.typescript).toBeDefined();
    expect(packageJson.devDependencies.tailwindcss).toBeDefined();
  });
});
