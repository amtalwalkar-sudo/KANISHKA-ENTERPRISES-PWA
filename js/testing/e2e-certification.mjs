  }else{
    assert.equal(await page.getByRole('button',{name:'Record Odometer'}).count(),0);
    await recordAuthoritativeOdometer(130);
  }
  await reloadWork();
  await workState('.business-trip-card');
  const cardText=await page.locator('.business-trip-card').innerText();
  console.log('[DIAGNOSTIC] .business-trip-card raw innerText:',JSON.stringify(cardText));
  assert.ok(/Distance\s*30\.0\s*km/i.test(cardText),`Expected Business Trip distance 30.0 km in .business-trip-card text, got: ${cardText}`);
  await page.getByRole('button',{name:'End Business Trip'}).click();
  await workState('.shift-card');

  await page.getByRole('button',{name:'Personal Trip'}).click();
  await workState('.personal-trip-card');
  const personalOdometerForm=await expandOperationIfPresent('Odometer');
  if(personalOdometerForm){