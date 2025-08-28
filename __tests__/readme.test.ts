
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
https://cloud.google.com/billing/docs/how-to/billing-access?_gl=1*14kqqf0*_ga*MTY3NDc2Mjc4Ny4xNzU0NDU4NTQy*_ga_WH2QY8WWF5*czE3NTYzMzk3NTQkbzgkZzEkdDE3NTYzNDAxNzMkajE2JGwwJGgw#billing.admin