import { expect, test } from '@playwright/test';

for (const layout of ['Tisch (Teams sitzen gegenüber)', 'Klassisch']) {
  test(`plays a complete game without audio (${layout})`, async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'MyMusicQuest' })).toBeVisible();
    await expect(
      page.getByText('1926 Lieder verfügbar, davon 1926', { exact: false }),
    ).toBeVisible();

    await page.getByLabel('Team 1').fill('Füchse');
    await page.getByLabel('Team 2').fill('Eulen');
    for (let i = 0; i < 7; i++)
      await page.getByRole('button', { name: 'weniger', exact: true }).click();
    await expect(page.locator('.stepper output').first()).toHaveText('3');
    await expect(page.locator('.stepper output').nth(1)).toHaveText('3');
    await page.getByRole('button', { name: 'Ohne Ton' }).click();
    // small pool so the game ends at the latest when it runs out of songs
    await page.getByRole('button', { name: '50er' }).click();
    await expect(page.getByText('38 Lieder verfügbar', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: layout }).click();
    await page.getByRole('button', { name: 'Spiel starten' }).click();

    // opening: Füchse claim the first song, Eulen play next
    await page.getByRole('button', { name: 'Füchse wusste es' }).click();
    await expect(page.getByText('Füchse bekommt die erste Karte!')).toBeVisible();
    await page.getByRole('button', { name: 'Weiter' }).first().click();
    await expect(page.getByText('Eulen ist dran')).toBeVisible();

    // first placement on an empty timeline is always correct
    await page.getByRole('button', { name: 'Hier einordnen' }).click();
    await expect(page.getByText('Richtig! Eulen behält die Karte.')).toBeVisible();

    let challenged = false;
    for (let i = 0; i < 200; i++) {
      if (
        await page
          .getByText(/gewinnt!|Unentschieden!/)
          .first()
          .isVisible()
      )
        break;
      const next = page.getByRole('button', { name: 'Weiter' }).first();
      const challenge = page.getByRole('button', { name: /Einspruch!/ });
      const reveal = page.getByRole('button', { name: 'Aufdecken' });
      if (await next.isVisible()) await next.click();
      else if (!challenged && (await challenge.isVisible())) {
        // the other team challenges once, picking a gap in the active team's timeline
        challenged = true;
        await challenge.click();
        const own = page.locator('.half', { has: page.locator('.challenge-head') });
        const timeline = (await own.isVisible()) ? own : page.locator('.timeline-row.main');
        await timeline.locator('.gap').first().click();
        await expect(
          page.getByText(/Einspruch erfolgreich|Einspruch abgewiesen|Beide falsch/).first(),
        ).toBeVisible();
        await expect(page.getByText('✋ 2')).toBeVisible();
      } else if (await reveal.isVisible()) await reveal.click();
      else await page.locator('.gap').first().click();
    }
    await expect(page.getByText(/gewinnt!|Unentschieden!/).first()).toBeVisible();
    expect(challenged).toBe(true);

    // reload keeps the finished game, "Neues Spiel" returns to setup
    await page.reload();
    await expect(page.getByText(/gewinnt!|Unentschieden!/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Neues Spiel' }).click();
    await expect(page.getByRole('button', { name: 'Spiel starten' })).toBeVisible();
    await expect(page.getByLabel('Team 1')).toHaveValue('Füchse');
  });
}

test('toggles fullscreen', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Vollbild', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Vollbild beenden' })).toBeVisible();
  expect(await page.evaluate('document.fullscreenElement !== null')).toBe(true);
  await page.getByRole('button', { name: 'Vollbild beenden' }).click();
  await expect(page.getByRole('button', { name: 'Vollbild', exact: true })).toBeVisible();
});
