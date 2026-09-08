const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const out='qa-output', origin='https://cbt.itisnowornever271.workers.dev';
fs.mkdirSync(out+'/audit-shots',{recursive:true});
const answer='School repair clubs help students develop useful skills and reduce waste. Working with local volunteers also connects different generations. However, schools need skilled adults to ensure safety, and replacement parts may be expensive. Clear rules are necessary because repairing items can take a long time.';
test('three paid sets: reading navigation, answers, writing, listening and results',async({page},info)=>{
 const report={device:info.project.name,sha:process.env.QA_EXPECTED_SHA,sourceCommit:'c69fd06b6217b7ec714f8ed55b041b1a29a63ccd',target:'isolated-main-source',states:[],pageErrors:[],consoleErrors:[],httpErrors:[],audioMode:'real production bytes proxied to isolated app',setCounts:[]};
 page.on('pageerror',e=>report.pageErrors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/ERR_ABORTED/.test(m.text()))report.consoleErrors.push(m.text())});
 page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({status:r.status(),url:r.url()})});
 await page.route('**/audio-r2/**',async route=>{
  try{const u=new URL(route.request().url());const r=await route.fetch({url:origin+u.pathname+u.search,timeout:30000});await route.fulfill({response:r});}catch(e){await route.abort();}
 });
 async function snap(name){
  const metrics=await page.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}));
  const file='audit-shots/'+info.project.name+'-'+name+'.jpg';
  await page.screenshot({path:out+'/'+file,type:'jpeg',quality:65,scale:'css',fullPage:false,animations:'disabled'});
  await page.screenshot({path:out+'/'+file.replace(/\.jpg$/,'.png'),type:'png',scale:'device',fullPage:false,animations:'disabled'});
  report.states.push({name,url:page.url(),title:await page.title(),metrics,screenshot:file});
  expect.soft(metrics.horizontalOverflow,name+' horizontal overflow').toBe(false);
 }
 try{
  for(const set of ['set-01','set-02','set-03']){
   await page.goto('/exam.html?plan=three&set='+set+'&fresh=1&dev=1&start=1&module=reading&question=1');
   await expect(page.locator('.reading-frame')).toBeVisible();
   const counts=await page.evaluate(()=>({key:selectedSet.key,reading:getReadingQuestions().length,listening:listeningQuestions.length,writing:writingTasks.length,canonicalReady:window.Grade2CanonicalContent.ready,issues:window.Grade2CanonicalContent.issues}));
   report.setCounts.push(counts);
   expect(counts).toMatchObject({key:set,reading:31,listening:30,writing:2,canonicalReady:true});
   if(info.project.name==='desktop-1440x900'){
    fs.writeFileSync(out+'/resolved-content.json',JSON.stringify(await page.evaluate(()=>window.Grade2CanonicalContent),null,2));
   }
   await page.locator('[data-action="written-answer"]').first().click();
   await page.locator('[data-progress-review-open="reading"]').first().click();
   await expect(page.locator('[data-progress-review-modal="reading"]')).toBeVisible();
   await snap(set+'-reading-review');
   await page.locator('[data-progress-review-close]').last().click();
   await snap(set+'-reading');
   let done=false;
   for(let n=0;n<40;n++){
    const next=page.locator('.nav-button.next[data-action="reading-next"]');
    const last=(await next.innerText()).includes('ライティングへ');
    if(last){await snap(set+'-last-reading');await next.click();done=true;break;}
    await next.click();
   }
   expect(done).toBe(true);
   await expect(page.locator('[data-skill-break]')).toBeVisible();
   const pauseBefore=await page.evaluate(()=>appState.writtenRemaining);
   await page.waitForTimeout(1250);
   const pauseAfter=await page.evaluate(()=>appState.writtenRemaining);
   report.states.push({name:set+'-reading-writing-break',timerBefore:pauseBefore,timerAfter:pauseAfter,text:await page.locator('[data-skill-break]').innerText()});
   await page.locator('[data-skill-break-continue]').click();
   const box=page.locator('textarea.writing-textarea').first();
   await expect(box).toBeVisible();await box.fill(answer);await expect(box).toHaveValue(answer);
   await snap(set+'-writing');
   const toolbar=page.locator('.developer-toolbar');
   await toolbar.getByRole('button',{name:'リスニング',exact:true}).click();
   await expect(page.locator('.listen-frame')).toBeVisible();
   await snap(set+'-listening');
   await toolbar.getByRole('button',{name:'採点・解説',exact:true}).click();
   await expect(page.locator('.result-screen')).toBeVisible();
   await snap(set+'-results');
  }
  expect.soft(report.pageErrors).toEqual([]);
  expect.soft(report.httpErrors).toEqual([]);
  expect.soft(report.consoleErrors).toEqual([]);
 }finally{fs.writeFileSync(out+'/audit-'+info.project.name+'.json',JSON.stringify(report,null,2));}
});
test('production build and complete paid Listening audio inventory',async({page,request},info)=>{
 test.skip(info.project.name!=='desktop-1440x900');
 await page.goto('/exam.html?plan=three&dev=1&fresh=1');
 const sets=await page.evaluate(()=>window.Grade2CanonicalContent.sets.filter(s=>['set-01','set-02','set-03'].includes(s.key)));
 const audio=sets.flatMap(s=>s.listeningQuestions.map(q=>({set:s.key,id:q.id,path:q.audioFile})));
 const report={target:origin,build:null,audio:[],publicPages:[],createdAt:new Date().toISOString()};
 try{
  const build=await request.get(origin+'/build-info.json');report.build={status:build.status(),body:await build.text()};
  for(const p of ['/','/exam.html?plan=sample&demo=1&fresh=1','/exam.html?plan=single','/exam.html?plan=three','/bonus.html','/support.html','/terms.html','/privacy.html','/tokusho.html']){
   const r=await request.get(origin+p,{maxRedirects:0});report.publicPages.push({path:p,status:r.status(),location:r.headers().location||'',type:r.headers()['content-type']||''});
  }
  for(let i=0;i<audio.length;i+=5){
   const items=await Promise.all(audio.slice(i,i+5).map(async a=>{
    try{const u=new URL(a.path,origin);const r=await request.get(u.href,{headers:{Range:'bytes=0-4095'},timeout:25000});const body=await r.body();return {...a,url:u.href,status:r.status(),type:r.headers()['content-type'],bytes:body.length,signature:body.subarray(0,4).toString('ascii')};}
    catch(e){return {...a,error:e.message};}
   }));report.audio.push(...items);
  }
  expect(audio).toHaveLength(90);
  for(const a of report.audio){expect.soft(a.error,a.set+' '+a.id).toBeUndefined();expect.soft([200,206],a.url).toContain(a.status);expect.soft(a.type||'',a.url).toMatch(/^audio\//);expect.soft(a.bytes||0,a.url).toBeGreaterThan(44);}
 }finally{fs.writeFileSync(out+'/production-inventory.json',JSON.stringify(report,null,2));}
});

test('paid route must require access regardless of HTML extension',async({page,request},info)=>{
 test.skip(info.project.name!=='desktop-1440x900');
 const paths=['/exam.html?plan=three','/exam?plan=three'],results=[];
 for(const p of paths){const r=await request.get(origin+p,{maxRedirects:0});results.push({path:p,status:r.status(),location:r.headers().location||''});}
 await page.goto(origin+'/exam?plan=three');
 const visible=await page.getByText('3回プレミアム',{exact:true}).count();
 const first=page.getByRole('button',{name:/第1回 リーディング全パート/});
 const report={target:origin,cookieMode:'fresh Playwright context without checkout',responses:results,premiumLabelCount:visible,firstSetButtonVisible:await first.isVisible()};
 fs.writeFileSync(out+'/production-route-gate.json',JSON.stringify(report,null,2));
 await page.screenshot({path:out+'/production-route-gate.png',type:'png',scale:'device'});
 await page.screenshot({path:out+'/production-route-gate.jpg',type:'jpeg',quality:65,scale:'css'});
 expect(report.firstSetButtonVisible,'Unauthenticated normalized route exposes premium set selection').toBe(false);
});
