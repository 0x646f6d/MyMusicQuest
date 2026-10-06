import { expect, test } from '@playwright/test';

test('plays a complete game without audio', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'MyMusicQuest' })).toBeVisible();
  await expect(page.getByText('40 Lieder verfügbar')).toBeVisible();

  await page.getByLabel('Team 1').fill('Füchse');
  await page.getByLabel('Team 2').fill('Eulen');
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'weniger' }).click();
  await expect(page.locator('.stepper output')).toHaveText('3');
  await page.getByRole('button', { name: 'Ohne Ton' }).click();
  await page.getByRole('button', { name: 'Spiel starten' }).click();

  // opening: Füchse claim the first song, Eulen play next
  await page.getByRole('button', { name: 'Füchse wusste es' }).click();
  await expect(page.getByText('Füchse bekommt die erste Karte!')).toBeVisible();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.getByText('Eulen ist dran')).toBeVisible();

  // first placement on an empty timeline is always correct
  await page.getByRole('button', { name: 'Hier einordnen' }).click();
  await expect(page.getByText('Richtig! Eulen behält die Karte.')).toBeVisible();

  for (let i = 0; i < 60; i++) {
    if (await page.getByText(/gewinnt!|Unentschieden!/).isVisible()) break;
    const next = page.getByRole('button', { name: 'Weiter' });
    if (await next.isVisible()) await next.click();
    else await page.locator('.gap').first().click();
  }
  await expect(page.getByText(/gewinnt!|Unentschieden!/)).toBeVisible();

  // reload keeps the finished game, "Neues Spiel" returns to setup
  await page.reload();
  await expect(page.getByText(/gewinnt!|Unentschieden!/)).toBeVisible();
  await page.getByRole('button', { name: 'Neues Spiel' }).click();
  await expect(page.getByRole('button', { name: 'Spiel starten' })).toBeVisible();
  await expect(page.getByLabel('Team 1')).toHaveValue('Füchse');
});
