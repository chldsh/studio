
import fs from 'fs';
import path from 'path';

describe('README.md', () => {
  it('should contain the correct content', () => {
    const readmePath = path.join(process.cwd(), 'README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');
    expect(readmeContent).toContain('# Firebase Studio');
    expect(readmeContent).toContain('This is a NextJS starter in Firebase Studio.');
    expect(readmeContent).toContain('To get started, take a look at src/app/page.tsx.');
  });
});
